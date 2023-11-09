import nodeMailer from "nodemailer";


export const sendEmail = async (options) => {

    const transporter = nodeMailer.createTransport({


        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "f6e932962f1b2e",
            pass: "9d7e712b58461f",
        },
    });

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
}











// host: process.env.SMTP_HOST,
// port: process.env.SMTP_PORT,
// auth:{
//     user: process.env.SMTP_MAIL,
//     pass: process.env.SMTP_PASSWORD,
// },
// service: process.env.SMTP_SERVICE,
