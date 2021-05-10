// DATA QUERIES


// INITIAL CALL TO GET DATA
// GET DATA
function getInitTableData(query) {
  // Add loading function here
  startLoad();
  domo.get(query)
    .then(data => {
      data.sort((a,b) => {
        return b.amount - a.amount
      });
      paintSummaryTable(data);
    })
    .catch(err => console.log(err));
};

// QUERY MGT AND PROP CO DATA
function getTabTableData(query) {
  // Add loading function here
  startLoad();
  domo.get(`/domo/datastores/v1/collections/ap-app-data/documents/`)
    .then(appData => {
      let db = [];
      let obj = [];
      let responseData = [];
      appData.forEach(inv => {
        id = inv.content.unique_id.toString();
        objId = inv.id;
        db.push(id);
        obj.push({
          id,
          objId
        });
        // console.log(db);
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
          // paintTabTable(data);

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
                responseData[index].objId = item.objId;
              });
              paintTabTable(responseData);
            })
            .catch(err => console.log(err));
          } else {
            responseData.sort((a,b) => {
              return b.amount - a.amount
            });
            obj.forEach(item => {
              index = responseData.findIndex(inv => inv.unique_id == item.id);
              responseData[index].objId = item.objId;
            });
            paintTabTable(responseData)
          };
          
        })
        .catch(err => console.log(err)); 
    })
    .catch(err => console.log(err));
  
};

// SAVE RECOMMENDED TO COLLECTION
function saveInvoiceToDatabase(invoice, target) {
  // startLoad();
  domo.post(`/domo/datastores/v1/collections/ap-app-data/documents/`, {
    "content": {
      unique_id: invoice.unique_id,
      ap_group: invoice.ap_group,
      amt_to_pay: invoice.amt_to_pay,
      total_inv_amt: invoice.total_inv_amt,
      rec_for_pmt_timestamp: invoice.rec_for_pmt_timestamp
    }
  })
    .then(
      data => {
      document.getElementById(target).id = data.id;
      // endLoad();
    })
    .catch(err => {
      console.log(err);
      // createAlert('Error saving invoice to database. Please uncheck and try again', 'warning-alert')
    });
};

// REMOVE RECOMMENDED FROM COLLECTION
function deleteInvoiceFromDatabase(target, id) {
  // startLoad();
  domo.delete(`domo/datastores/v1/collections/ap-app-data/documents/${target}`)
    .then(data => {
      document.getElementById(target).id = `row-${id}`;
      // console.log(data);
      // endLoad();
    })
    .catch(err => console.log(err));
};