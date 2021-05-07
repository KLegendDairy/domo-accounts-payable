// DATA QUERIES


// INITIAL CALL TO GET DATA
// GET DATA
function getInitTableData(query) {
  // Add loading function here

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
function getMgtTableData(query) {
  // Add loading function here
  
  domo.get(query)
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
      });
      paintMgtTable(data);
    })
    .catch(err => console.log(err));
};