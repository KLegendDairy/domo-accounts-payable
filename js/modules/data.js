// ===================== DATA QUERIES TO DOMO DB AND APPDB FOR APP =====================


// ===================== SUMMARY TAB =====================

// GET SUMMARY DATA TABLE DATA
function getSummaryTableData(url, query) {
  startLoad();
  let resData = [];
  domo.post(url, query, { contentType: 'text/plain' })
    .then(data => {
      data.rows.forEach(item => {
        resData.push({
          apGroup: item[0],
          invoicesDue: item[1],
          amountDue: item[2]
        });
      });
    domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.ap_group&count=documentCount&sum=content.amt_to_pay`,{})
      .then(data => {
        data.forEach(group => {
          let i = resData.findIndex(item => item.apGroup === group._id);
          if(i !== -1) {
            resData[i].invoicesRecommended = group.documentCount;
            resData[i].amountRecommended = group.amt_to_pay;
          };
        });
        displaySummaryTab(resData);
      });
    })
    .catch(err => console.log(err));
};

// GET DATA
function getInitTableData(query) {
  startLoad();
  domo.get(query)
    .then(data => {
      let resData = [];
      data.sort((a,b) => {
        return b.amount - a.amount
      });
      data.forEach(item => {
        resData.push(item);
      });
      domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.company&count=documentCount&sum=content.amt_to_pay`,{})
        .then(appData => {
          appData.forEach(inv => {
            let i = resData.findIndex(item => item.company === inv._id);
            if(i !== -1) {
              resData[i].recForPmt = inv.amt_to_pay;
              resData[i].invToPay = inv.documentCount;
            };
          });
          paintSummaryTable(resData);
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};


// ===================== DETAIL PAGE QUERIES =====================

// GET SUMMARY TABLE DATA FOR THE DETAIL PAGES
function getSummaryTableDetailData(query) {
  startLoad();
  domo.get(query)
    .then(data => {
      let resData = [];
      data.sort((a,b) => {
        return b.amount - a.amount;
      });
      data.forEach(inv => {
        resData.push(inv);
      });
      domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.company&count=documentCount&sum=content.amt_to_pay`,{})
        .then(data => {
          data.forEach(inv => {
            i = resData.findIndex(item => item.company === inv._id);
            if(i !== -1) {
              resData[i].invoicesRecommended = inv.documentCount;
              resData[i].amountRecommended = inv.amt_to_pay;
            };
          });
          displaySummaryTabDetail(resData);
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

// QUERY MGT AND PROP CO DATA
function getTabTableData(query) {
  startLoad();
  domo.get(`/domo/datastores/v1/collections/ap-app-data/documents/`)
    .then(appData => {
      let db = [];
      let obj = [];
      let responseData = [];
      appData.forEach(inv => {
        const id = inv.content.unique_id.toString();
        const objId = inv.id;
        const amtToPay = inv.content.amt_to_pay;
        const approval = inv.content.approval_timestamp ? inv.content.approval_timestamp : '';

        db.push(id);
        obj.push({
          id,
          objId,
          amtToPay,
          approval
        });
      })
      
      domo.get(`${query}${db.length > 0 ? ',unique_id in [' + db.toString() + ']' : ''}`)
        .then(data => {
          data.sort((a,b) => {
            return b.amount - a.amount
          });
          data.forEach(inv => {
            if(inv.dueInDays < 0) {
              inv.status = 'Not Yet Due';
            } else {
              inv.status = 'Past Due';
            };
            if (db.length > 0) {
              inv.recommended = true;
            }
            responseData.push(inv);
          });

          if(db.length > 0) {
            domo.get(`${query},unique_id !in [${db.toString()}]`)
            .then(finalData => {
              finalData.sort((a,b) => {
                return b.amount - a.amount
              });
              finalData.forEach(inv => {
                if(inv.dueInDays < 0) {
                  inv.status = 'Not Yet Due';
                } else {
                  inv.status = 'Past Due';
                };
                responseData.push(inv);
              });
              responseData.sort((a,b) => {
                return b.amount - a.amount
              });
              obj.forEach(item => {
                index = responseData.findIndex(inv => inv.unique_id == item.id);
                if(index !== -1) {
                  responseData[index].objId = item.objId;
                  responseData[index].amtToPay = item.amtToPay;
                  responseData[index].approval = item.approval;
                };
              });
              paintTabTable(responseData);
            })
            .catch(err => console.log(err));
          } else {
            responseData.sort((a,b) => {
              return b.amount - a.amount
            });
            paintTabTable(responseData)
          };
          
        })
        .catch(err => console.log(err)); 
    })
    .catch(err => console.log(err)); 
};


// ============== SAVE, DELETE AND UPDATE FROM COLLECTIONS ================

// SAVE RECOMMENDED TO COLLECTION
function saveInvoiceToDatabase(invoice, target, e) {
  domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/`, {
    "content": {
      unique_id: invoice.unique_id,
      company: invoice.company,
      ap_group: invoice.ap_group,
      amt_to_pay: invoice.amt_to_pay,
      total_inv_amt: invoice.total_inv_amt,
      rec_for_pmt_timestamp: invoice.rec_for_pmt_timestamp
    }
  })
    .then(
      data => {
      document.getElementById(target).id = data.id;
      toggleCheckbox(e);
    })
    .catch(err => console.log(err));
};

// REMOVE RECOMMENDED FROM COLLECTION
function deleteInvoiceFromDatabase(target, id, e) {
  domo.delete(`domo/datastores/v1/collections/ap-app-data/documents/${target}`)
    .then(data => {
      document.getElementById(target).id = `row-${id}`;
      toggleCheckbox(e);
    })
    .catch(err => console.log(err));
};


// ============== APPROVE ALL INVOICES ================
function approveAllInvoices() {
  startLoad();
  domo.get(`/domo/datastores/v1/collections/ap-app-data/documents/`)
    .then(data => {
      const reqBody = [];
      data.forEach(inv => {
        // Create empty object
        const obj = {};
        // Set approval variables
        inv.content.approved = 'true';
        inv.content.approval_timestamp = new Date().toISOString();

        // Setup object to be pushed into bulk update request
        obj.id = inv.id;
        obj.content = inv.content;
        reqBody.push(obj);
      });
      domo.put(`/domo/datastores/v1/collections/ap-app-data/documents/bulk`, reqBody)
        .then(data => {
          endLoad();
          const mTxt = `${data.Updated} invoices are approved!`
          const bTxt = 'Okay'
          const bId = 'close'
          showModal(mTxt, bTxt, bId);
        })
        .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
};