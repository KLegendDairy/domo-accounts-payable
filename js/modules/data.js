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
      domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.ap_group&count=documentCount&sum=content.amt_to_pay`,{
        "content.paid": {
          $ne: 'true'
        }
      })
        .then(data => {
          domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.ap_group&count=documentCount&sum=content.amt_to_pay&filter=`,{
            "content.approved": {
              $eq: 'true'
            },
            "content.paid": {
              $ne: 'true'
            }
          })
            .then(newData => {
              newData.forEach(apr => {
                x = resData.findIndex(rec => rec.apGroup === apr._id);
                if(x !== -1) {
                  resData[x].approved = apr.documentCount;
                  resData[x].approvedAmount = apr.amt_to_pay;
                };
              });
              data.forEach(group => {
                let i = resData.findIndex(item => item.apGroup === group._id);
                if(i !== -1) {
                  resData[i].invoicesRecommended = group.documentCount;
                  resData[i].amountRecommended = group.amt_to_pay;
                };
              });
              displaySummaryTab(resData);
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

// GET DATA FOR COMPANY TABLE ON SUMMARY TAB
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
      domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.company&count=documentCount&sum=content.amt_to_pay`,{
        "content.paid": {
          $ne: 'true'
        }
      })
        .then(appData => {
          domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.company&count=documentCount&sum=content.amt_to_pay&filter=`,{
            "content.approved": {
              $eq: 'true'
            },
            "content.paid": {
              $ne: 'true'
            }
          })
            .then(newData => {
              newData.forEach(apr => {
                x = resData.findIndex(rec => rec.company === apr._id);
                if(x !== -1) {
                  resData[x].approved = apr.documentCount;
                  resData[x].approvedAmount = apr.amt_to_pay;
                };
              });
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
      domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.company&count=documentCount&sum=content.amt_to_pay`,{
        "content.paid": {
          $ne: 'true'
        }
      })
        .then(data => {
          domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.company&count=documentCount&sum=content.amt_to_pay&filter=`,{
            "content.approved": {
              $eq: 'true'
            },
            "content.paid": {
              $ne: 'true'
            }
          })
          .then(newData => {
            newData.forEach(apr => {
              x = data.findIndex(rec => rec._id === apr._id);
              if(x !== -1) {
                data[x].approved = apr.documentCount;
                data[x].approvedAmount = apr.amt_to_pay;
              };
            });
            data.forEach(inv => {
              i = resData.findIndex(item => item.company === inv._id);
              if(i !== -1) {
                resData[i].invoicesRecommended = inv.documentCount;
                resData[i].amountRecommended = inv.amt_to_pay;
                if(inv.approved) {
                  resData[i].approved = inv.approved;
                };
                if(inv.approvedAmount) {
                  resData[i].approvedAmount = inv.approvedAmount;
                };
              };
            });
            displaySummaryTabDetail(resData);
          })
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

// QUERY MGT AND PROP CO DETAIL DATA
function getTabTableData(query) {
  startLoad();
  domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query`, {
    "content.paid": {
      $ne: 'true'
    }
  })
    .then(appData => {
      let db = [];
      let obj = [];
      let responseData = [];
      appData.forEach(inv => {
        const id = inv.content.unique_id.toString();
        const objId = inv.id;
        const amtToPay = inv.content.amt_to_pay;
        let approval = inv.content.approval_timestamp;

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
                  if(item.approval) {
                    responseData[index].approval = item.approval;
                  };
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


// ============== INVOICE APPROVALS ================
function approveAllInvoices() {
  startLoad();
  domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query`,{
    "content.approved": {
      $ne: 'true'
    }
  })
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
          document.querySelector('.selected').click();
          const mTxt = `<span class="secondary-text">${data.Updated}</span> invoices have been successfully approved!`
          const bTxt = 'Okay'
          const bId = 'close'
          showModal(mTxt, bTxt, bId);
        })
        .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
};

function unapproveAllInvoices() {
  startLoad();
  domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query`,{
    "content.approved": {
      $eq: 'true'
    }
  })
    .then(data => {
      const reqBody = [];
      data.forEach(inv => {
        const obj = {};
        delete inv.content.approved;
        delete inv.content.approval_timestamp

        obj.id = inv.id;
        obj.content = inv.content;
        reqBody.push(obj);
      });
      domo.put(`/domo/datastores/v1/collections/ap-app-data/documents/bulk`, reqBody)
      .then(data => {
        endLoad();
        document.querySelector('.selected').click();
        const mTxt = `<span class="secondary-text">${data.Updated}</span> invoices have been successfully unapproved.`
        const bTxt = 'Okay'
        const bId = 'close'
        showModal(mTxt, bTxt, bId);
      })
      .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};


// ================ GET PAID INVOICE DATA AND SYNC PAID INVOICE DATA ================

// GET PAID INVOICE DATA TO POPULATE TABLES
function getPaidInvoiceTableData(query) {
  startLoad();
  
  domo.get(query)
    .then(data => {
      let responseData = [];
      let reqBody = [];
      data.forEach(inv => responseData.push(inv));
      domo.get(`/domo/datastores/v1/collections/ap-app-data/documents/`)
      .then(appData => {
        appData.forEach(item => {
          let temp = {};
          const i = responseData.findIndex(inv => inv.unique_id.toString() === item.content.unique_id.toString());
          if(i !== -1) {
            responseData[i].approved = item.content.approved;
            responseData[i].approval = item.content.approval_timestamp;
            temp.id = item.id;
            temp.content = item.content;
            temp.content.paid = 'true';
            reqBody.push(temp);
          };
        });
        responseData.sort((a,b) => {
          return b.amount - a.amount;
        });
        paintPaidTable(responseData);
        domo.put(`/domo/datastores/v1/collections/ap-app-data/documents/bulk`, reqBody)
          .then(data => {
            return true;
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
  };

// FUNCTION TO SYNC PAID INVOICES ON LOAD
function paidCheck() {
  startLoad();
  return new Promise((resolve, reject) => {
    domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query`, {
      "content.paid": {
        $ne: 'true'
      }
    })
    .then(appData => {
      let db = [];
      let obj = [];
      let responseData = [];
      let reqBody = [];
      let temp = {};
      if(appData.length > 0) {
        appData.forEach(inv => {
          const unique_id = inv.content.unique_id;
          const objId = inv.id;
          const amtToPay = inv.content.amt_to_pay;
          let approved = inv.content.approved;
          let approval = inv.content.approval_timestamp;
          const ap_group = inv.content.ap_group;
          const company = inv.content.company;
          const total_inv_amt = inv.content.total_inv_amount;
          const rec_for_pmt_timestamp = inv.content.rec_for_pmt_timestamp;
          
          db.push(unique_id);
          obj.push({
            unique_id,
            objId,
            amtToPay,
            approved,
            approval,
            ap_group,
            company,
            total_inv_amt,
            rec_for_pmt_timestamp
          });
        })
      };
      if(db.length > 0) {
        domo.get(`/data/v1/paidInvoices?sum=amount&groupby=unique_id,vendor,company,billDate,dueDate,date_paid,ap_group,company_group,invoice_num,bdcUrl&filter=unique_id in [${db.toString()}]`)
          .then(data => {
            if(data.length > 0) {
              data.sort((a,b) => {
                return b.amount - a.amount
              });
              data.forEach(inv => {
                responseData.push(inv);
              });
              obj.forEach(item => {
                index = responseData.findIndex(inv => inv.unique_id == item.id);
                if(index !== -1) {
                  responseData[index].objId = item.objId;
                  responseData[index].amtToPay = item.amtToPay;
                  if(item.approval) {
                    responseData[index].approval = item.approval;
                  };
                  temp = {};
                  temp.id = item.objId;
                  temp.content = {
                    ap_group: item.ap_group,
                    company: item.company,
                    unique_id: item.unique_id,
                    amt_to_pay: item.amtToPay,
                    total_inv_amt: item.amount,
                    rec_for_pmt_timestamp: item.rec_for_pmt_timestamp,
                    approved: item.approved,
                    approval_timestamp: item.approval
                  };
                  temp.content.paid = 'true';
                  reqBody.push(temp);
                };
              });
              if(temp.length > 0) {
                domo.put(`/domo/datastores/v1/collections/ap-app-data/documents/bulk`, reqBody)
                  .then(data => {
                    resolve('done');
                  })
                  .catch(err => reject(err));
              };
            };
            resolve('done');
          })
          .catch(err => reject(err));
      };
      resolve('done')
      })
    .catch(err => reject(err));
  });
};

// ================ GET DATA TO UPDATE DATE ================

function updatingDate() {
  domo.get('/data/v1/accountsPayableData?min=last_updated')
            .then(first => {
                const data = []
                data.push(first[0])
                domo.get('/data/v1/paidInvoices?min=last_updated')
                    .then(second => {
                        data.push(second[0])
                        data.sort((a,b) => {
                            return new Date(a.last_updated) - new Date(b.last_updated)
                        });
                        const dt = new Date(data[0].last_updated)
                        updateDate(dt.toDateString() + ' ' + dt.toLocaleTimeString());
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
  };

// ================ GET DETAILS FOR UI INTERACTION ================

// GET INVOICES RECOMMENDED DATA
function getInvDetails() {
  return new Promise((resolve, reject) => {
    domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/query?groupby=content.approved&count=documentCount&sum=content.amt_to_pay`,{
      "content.paid": {
        $ne: 'true'
      }
    })
      .then(data => {
        const dataToSend = {};
        data.forEach(item => {
          if(item._id === 'true') {
            dataToSend.inv = item.documentCount;
            dataToSend.amt = item.amt_to_pay;
          } else {
            dataToSend.total = item.amt_to_pay;
            dataToSend.num = item.documentCount;
          }
        })
        resolve(dataToSend);
      })
      .catch(err => reject(err));
  });
};