

const config = {
    user: "sa", // user: "sqllogin",
    // password: "vegas123", // password: "GreatClub@2018",
    password: "vegas123", // password: "GreatClub@2018",
    // database: "neoncmsuat",
    database: "neoncmsprod",
    // server: "192.168.100.100", // server: "192.168.1.177", // server: "127.0.0.1",
    server: "192.168.100.201", // server: "192.168.1.177", // server: "127.0.0.1",
    options: {
        encrypt: false,
        trustServerCertificate: true,
        trustConnection: true,
        enableArithPort: true,
        instancename: "SQLEXPRESS"
    },
    port : 1433
}
// console.log("CONFIG FOR SERVER "+JSON.stringify(config))



module.exports = config;
