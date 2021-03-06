import {
    DB
} from '../config/database.js'
import bcrypt from 'bcrypt'
import resp_code from '../src/libs/response_code.js'

//this is set of data to encrypt or decrypt data
import {
    SetResponseJsonEncrypt
} from '../src/libs/response_encrypt.js'
import {
    SetResponseJsonDecrypt
} from '../src/libs/response_decrypt.js'

//this is to get jwt token
import {
    GetJwtToken
} from '../src/auth/jwt/useJwt.js'
import {
    login_validation,
    register_validation
} from '../src/validations/form_validation.js'

import dotenv from 'dotenv'
dotenv.config()

export const login = async (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var credential = login_validation(username, password)

    if (credential == true) {
        const db = await DB()
        const users = await db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
            if (err) {
                return res.json(err)
            } else {
                if (result.length != 0) {
                    bcrypt.compare(password, result[0].password, function (err, rest) {
                        if (rest == true) {
                            const token = GetJwtToken(result[0].id)

                            db.query(
                                `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
                            );

                            let dataJson = [];
                            for (var i in result) {
                                var resp_json = {
                                    data: {
                                        token: token
                                    },
                                    resp_code: resp_code[0]
                                };

                                dataJson.push(resp_json)
                            }
                            // var getResponseDecrypt = SetResponseJsonDecrypt(getResponse)

                            var data = dataJson;
                            return res.json(data)
                        } else {
                            var data = [resp_code[1]];
                            return res.json(data)
                        }
                    });
                } else {
                    var data = [resp_code[1]];
                    return res.json(data)
                }
            }
        })
    } else {
        var data = [resp_code[3]];
        return res.json(data)
    }
}

export const register = async (req, res) => {
    var username = req.body.username.toLowerCase();
    var password = req.body.password;
    var email = req.body.email;
    var nama_lengkap = req.body.nama_lengkap.toUpperCase();
    var handphone = req.body.handphone;
    var whatsapp = req.body.whatsapp;

    //hashing password
    var salt = bcrypt.genSaltSync(12);
    var hashPassword = bcrypt.hashSync(password, salt);

    var reg_validation = register_validation(req.body)

    if (reg_validation == true) {
        const db = await DB()

        try {
            await db.beginTransaction()

            var query1 = `INSERT INTO users (username, password, email, role_id) VALUES (?,?,?,?)`;
            
            const insertUsers = await db.query(query1, [username, hashPassword, email, 1], (err, result) => {
                if (err) {
                    db.rollback(() => {
                        return res.json(err)
                    });
                }else{
                    var query2 = `INSERT INTO user_details (user_id, nama_lengkap, handphone, whatsapp) VALUES (?,?,?,?)`;
                    db.query(query2, [result.insertId, nama_lengkap, handphone, whatsapp], (err, result) => {
                        if(err){
                            db.rollback(() => {
                                return res.json(err)
                            });
                        }else{
                            db.commit()
                            return res.json(resp_code[0])
                        }
                    })
                }
            })

        } catch (err) {
            await db.rollback(() => {
                return res.json(err)
            });
        }
    } else {
        var data = [resp_code[3]];
        return res.json(data)
    }
}

export const getDataUser = async (req, res) => {
    var user_id = req.user.id

    const db = await DB()

    var query = `SELECT
                a.id,
                b.handphone,
                b.whatsapp,
                b.nama_lengkap
                FROM users as a
                LEFT JOIN user_details as b
                ON a.id = b.user_id
                WHERE a.id = ?`;

    const users = await db.query(query, [user_id], (err, result) => {
        if (err) {
            return res.json(err)
        } else {
            let dataUser = [];
            for (var i in result) {
                dataUser.push({
                    data: {
                        id: result[i].id,
                        handphone: result[i].handphone,
                        nama_lengkap: result[i].nama_lengkap,
                        whatsapp: result[i].whatsapp
                    },
                    resp_code: resp_code[0]
                })
            }

            //encrypting response
            var getResponse = SetResponseJsonEncrypt(dataUser)

            return res.json(getResponse)
        }
    })
}

export const getData_params = (req, res) => {
    return res.json(req.body)
}