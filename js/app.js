(function init(){
  getSummaryTableData(`/sql/v1/accountsPayableData`, `SELECT company_ap_group, COUNT(DISTINCT CONCAT(\`unique_id\`,\`Community\`)), SUM(\`Amount Left To Pay\`) FROM accountsPayableData GROUP BY company_ap_group`);
  getInitTableData(`/data/v1/accountsPayableData?sum=amount&unique=unique_id&groupby=company,company_group,ap_group&fields=company,company_group,ap_group,amount,unique_id`);
  // domo.delete(`/domo/datastores/v1/collections/ap-app-data/documents/2d642c8d-69e3-430a-bdcd-307e7e5c2af9`)
  //   .then(data => console.log('delete',data));
  // domo.get(`/domo/datastores/v1/collections/ap-app-data/documents/`)
  //   .then(data => console.log(data));
})()