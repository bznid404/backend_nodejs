import {
    DB,
    DB2
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

//Required when use File Upload
import fs from 'fs'
import formidable from 'formidable'

import {
    ftp_client,
    ftp1
} from '../config/file_storage.js'

dotenv.config()

//Single File
const Upload = (req, res) => {
    let form = new formidable.IncomingForm()
    form.parse(req, function (err, fields, files) {
        var newpath = '/' + files.image.originalFilename;

        fs.readFile(files.image.filepath, (err, result) => {
            ftp_client.connect(ftp1);
            ftp_client.on('ready', function () {
                ftp_client.put(result, newpath, function (err) {
                    if (err) {
                        return res.json(err)
                    } else {
                        try {
                            DB2.beginTransaction()
                            var query = `INSERT INTO file_upload (user_id, file) VALUES (?,?)`;
                            DB2.query(query, [req.user.id, files.image.originalFilename], (err, result) => {
                                if (err) {
                                    DB2.rollback(() => {
                                        return res.json(err)
                                    });
                                } else {
                                    DB2.commit()
                                    return res.json(resp_code[0])
                                }
                            })
                        } catch (err) {
                            DB2.rollback(() => {
                                return res.json(err)
                            });
                        }
                    }
                    ftp_client.end();
                });
            });
        })
    });
}

//Multiple File
const Upload2 = (req, res) => {
    ftp_client.connect(ftp1);

    let form = new formidable.IncomingForm()
    form.parse(req, function (err, fields, files) {
        // for (let i = 0; i < files.length; i++){
        //     return res.json(files[i].image)
        // }
        var data_image = JSON.parse(JSON.stringify(form.openedFiles))
        data_image.forEach(data => {

            var newpath = '/' + data.originalFilename;
            fs.readFile(data.filepath, (err, result) => {
                ftp_client.on('ready', function () {
                    ftp_client.put(result, newpath, function (err) {
                        if (err) {
                            return res.json(err)
                        }
                    });
                });
            })

        })
        //ftp_client.end();
        return res.json("berhasil")
    })
}

export {
    Upload,
    Upload2
}