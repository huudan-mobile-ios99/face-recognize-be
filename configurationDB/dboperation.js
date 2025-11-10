var config = require('./dbconfig');
const DBNAME = '[neoncmsprod]';
const sql = require('mssql');
// const { sendRequestToServer, checkServerConnectivity } = require('./socket');



// GET MACHINE ONLINE STATUS
async function getMachineOnlineStatus(date) {
    // console.log('getMachineOnlineStatus');
    try {
    let pool = await sql.connect(config)
    let query = `SELECT dbo.Machine.Number,dbo.Machine.OnlineStatus, dbo.machineplayersession.[Status] FROM ${DBNAME}.[dbo].[MachinePlayerSession] Join dbo.Machine
        On dbo.machine.MachineID=dbo.MachinePlayerSession.MachineID
        Where dbo.machineplayersession.Status='1'
        And dbo.machine.number IN ('301','302','303','304','305','306','307','308','309','310','311','312')
        And StartGamingDate=@input_id`;
    const data_query = await pool.request().input('input_id', sql.NVarChar, date).query(`${query}`)
    // console.log(`getMachineOnlineStatus`,data_query.recordset);
    return data_query.recordset;
    } catch (error) {
        console.log(`An error orcur getMachineOnlineStatus: ${error}`);
    }
}


// GET MACHINE SLOT ONLINE STATUS
async function getSlotOnlineStatus(date) {
    // console.log('getSlotOnlineStatus');
    try {
    let pool = await sql.connect(config);
    let query = `SELECT dbo.customer.Number,dbo.customer.PreferredName,  dbo.Machine.Number as MachineNumber,[StartGamingDate],[StartDateTime],dbo.machineplayersession.[Status]
        FROM ${DBNAME}.[dbo].[MachinePlayerSession]
        Join dbo.Machine
        On dbo.machine.MachineID=dbo.MachinePlayerSession.MachineID
        Join dbo.Customer
        On dbo.customer.CustomerID=dbo.MachinePlayerSession.CustomerID
        Where dbo.machineplayersession.Status='1'
        And dbo.machine.number IN ('21','22','501','502','503','504', '4001','4002','4003','4004','4005','906','301','302','303','304','305','306','307','308','309','310','311','312','313','314','315','316','317','318','319','320','321','322','323','324')  And StartGamingDate=@input_id`;
    const data_query = await pool.request().input('input_id', sql.NVarChar, date).query(`${query}`)
    // console.log(data_query.recordset);
    return data_query.recordset;
    } catch (error) {
        console.log(`An error orcur getSlotOnlineStatus: ${error}`);
    }
}


// // Load preset by preset ID function
// async function loadPreset(presetId) {
//     checkServerConnectivity();
//     const requestData = [
//         {
//             "cmd": "W0605",
//             "deviceId": 0,
//             "screenId": 0,
//             "presetId": presetId
//         }
//     ];
//     try {
//         await sendRequestToServer(requestData);
//         return `Load preset ${presetId} successfully`;
//     } catch (error) {
//         throw new Error(`Error loading preset ${presetId}: ${error.message}`);
//     }
// }



module.exports = {
    getMachineOnlineStatus: getMachineOnlineStatus,
    getSlotOnlineStatus:getSlotOnlineStatus,
    // loadPreset:loadPreset
}
