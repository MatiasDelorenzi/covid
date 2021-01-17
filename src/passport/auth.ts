const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const Doctor = require('../models/Doctor.ts')

passport.serializeUser((user, done)=>{
    done(null, user.id)
})

passport.deserializeUser( async (id,done)=>{
    const doctor = await Doctor.findById(id)
    done(null, doctor);
})


passport.use('local-signup', new LocalStrategy({
    usernameField: 'dni',
    passwordField: 'password',
    passReqToCallback:true
},async (req, dni, password, done)=>{
    const registeredDoctor = await Doctor.findOne({dni: dni})
    if (registeredDoctor){
        return done(null, false, req.flash('signupMessage', 'El DNI ' + req.body.dni + ' ya se encuentra registrado.'))
    } else {
        if (password != req.body.passwordCheck){
            return done(null, false, req.flash('signupMessage', 'Las contraseñas no coinciden.'))
        } else {
            const newDoctor = new Doctor()
            newDoctor.dni = dni,
            newDoctor.password = newDoctor.encryptPassword(password),
            newDoctor.name = req.body.name,
            newDoctor.lastName = req.body.lastName
            newDoctor.hospital = req.body.hospital
            console.log(req.body.role)
            if (!req.body.role) {
                newDoctor.role = "doctor"
            } else if (req.body.role === "admin"){
                newDoctor.role = "admin"
            } else if (req.body.role === "doctor"){
                newDoctor.role = "doctor"
            }       
            newDoctor.save()
            done(null, null, req.flash('signupMessageSuccess', 'El médico ' + req.body.lastName + ' ' + req.body.name + ' fue registrado correctamente.'))
        }
         
    }
 
}))


passport.use('local-signin', new LocalStrategy({
    usernameField: 'dni',
    passwordField: 'password',
    passReqToCallback:true
}, async (req, dni, password, done) =>{
    const registeredDoctor = await Doctor.findOne({dni: dni})
    if (!registeredDoctor){
        return done(null,false, req.flash('signinMessage', 'El usuario no existe'))
    } 
    if (!registeredDoctor.comparePassword(password)){
        return done(null, false, req.flash('signinMessage', 'Contraseña incorrecta'))
    }
    done(null, registeredDoctor)
}))


exports.changeMyPassword = async (req, res, done) =>{
    const doctorFound = await Doctor.findOne({ dni: req.user.dni})
    const actual = req.body.actualPassword
    const newPass = req.body.newPassword
    const newPassCheck = req.body.newPasswordCheck
    if (!doctorFound.comparePassword(actual)){
        return req.flash('signupMessage', 'Contraseña incorrecta.')
    }
    if (newPass != newPassCheck){
        return req.flash('signupMessage', 'Las contraseñas no coinciden.')
    }
    const newDoctor = new Doctor()
    await Doctor.findOneAndUpdate({dni: req.user.dni}, {$set: {"password": newDoctor.encryptPassword(newPass)}})
    return req.flash('signupMessageSuccess', 'Contraseña cambiada.')
}

exports.changeUserPassword =  async (req, res, done) =>{
    const doctorFound = await Doctor.findOne({ dni: req.body.dni})
    const newPass = req.body.newPassword
    const newPassCheck = req.body.newPasswordCheck
    if (newPass != newPassCheck){
        return req.flash('signupMessage', 'Las contraseñas no coinciden.')
    }
    if (req.user.role != "master"){
        if (doctorFound.role === "admin" || doctorFound.role === "master"){
            return req.flash('signupMessage', 'Usted no posee permisos para cambiar la contraseña de un administrador.')
        }
    }
    const newDoctor = new Doctor()
    await Doctor.findOneAndUpdate({dni: req.body.dni}, {$set: {"password": newDoctor.encryptPassword(newPass)}})
    return req.flash('signupMessageSuccess', 'Contraseña cambiada.')
}