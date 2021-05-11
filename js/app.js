(function init(){
  getSummaryTableData(`/sql/v1/accountsPayableData`, `SELECT company_ap_group, COUNT(DISTINCT \`unique_id\`), SUM(\`Amount Left To Pay\`) FROM accountsPayableData GROUP BY company_ap_group`);
  getInitTableData(`/data/v1/accountsPayableData?sum=amount&groupby=company,company_group,ap_group`);
  // domo.delete(`/domo/datastores/v1/collections/ap-app-data/documents/2d642c8d-69e3-430a-bdcd-307e7e5c2af9`)
  //   .then(data => console.log('delete',data));
  // domo.get(`/domo/datastores/v1/collections/ap-app-data/documents/`)
  //   .then(data => console.log(data));
})()