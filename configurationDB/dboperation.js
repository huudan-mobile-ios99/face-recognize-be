var config = require('./dbconfig');
const DBNAME = '[neoncmsprod]';
const sql = require('mssql');
// const { sendRequestToServer, checkServerConnectivity } = require('./socket');


//Face Recoginize Version 2
async function getFaceRecognizeFull(page = 1, limit = 50, number = null) {
  const offset = (page - 1) * limit;

  // Base query
  let query = `
    SELECT
      c.[Number],
      c.[PreferredName],
      co.[Nationality],
      co.ISOCode,
      c.[GamingDateLastVisited],
    FROM ${DBNAME}.[dbo].[Customer] c
    JOIN dbo.Country co ON co.CountryID = c.CountryID
    JOIN dbo.Visit v ON v.CustomerID = c.CustomerID
    WHERE v.GamingDate = c.GamingDateLastVisited
  `;

  // Add filter if `number` is given
  if (number) {
    query += ` AND c.[Number] = ${number} `;
  }

  // Order + Pagination
  query += `
    ORDER BY v.ActualDateTime DESC
    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
  `;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(query);
    const records = result.recordset;

    return {
      status: records.length > 0,
      message: records.length > 0
        ? `Retrieved ${records.length} face recognition data.`
        : `No face recognition data found.`,
      data: records,
    };
  } catch (error) {
    console.error(`Error in getFaceRecognizeFull: ${error}`);
    return {
      status: false,
      message: 'Failed to fetch data due to an error.',
      data: null,
    };
  }
}
//END FACE RECOGNIZE



module.exports = {
    getFaceRecognizeFull: getFaceRecognizeFull,
}
