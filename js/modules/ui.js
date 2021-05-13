// Declare UI Variables
const summaryBtn = document.getElementById('summary-link');
const mgtBtn = document.getElementById('mgt-prop-link');
const devBtn = document.getElementById('dev-other-link');
const paidBtn = document.getElementById('paid-invoices-link');
const dataTable = document.getElementById('data-table');
const filterBar = document.getElementById('filter');
const tableRow = dataTable.getElementsByTagName('tr');
const footerYear = document.getElementById('year-foot');
const summaryTable = document.getElementById('summary-table');
const topBtn = document.getElementById('topBtn');
const sumBtn = document.getElementById('hide-summary');

// LOAD EVENT LISTENERS
(function loadEventListeners() {
  summaryBtn.addEventListener('click', navClicked);
  mgtBtn.addEventListener('click', navClicked);
  devBtn.addEventListener('click', navClicked);
  paidBtn.addEventListener('click', navClicked);
  // filterBar.addEventListener('keyup', filterList);
  dataTable.addEventListener('change', checkBoxCheck);
  topBtn.addEventListener('click', goToTop);
  sumBtn.addEventListener('click', toggleSummary);
})();


// ===================== DATA CALLS =====================

// FUNCTION TO DISPLAY SUMMARY TABLE
function init() {
  getSummaryTableData(`/sql/v1/accountsPayableData`, `SELECT company_ap_group, COUNT(DISTINCT CONCAT(\`unique_id\`,\`Community\`)), SUM(\`Amount Left To Pay\`) FROM accountsPayableData GROUP BY company_ap_group`);
  getInitTableData(`/data/v1/accountsPayableData?sum=amount&unique=unique_id&groupby=company,company_group,ap_group&fields=company,company_group,ap_group,amount,unique_id`);
};

// FUNCTION TO DISPLAY MGT & PROP TABLE
function mgtAndProp() {
  getTabTableData(`/data/v1/accountsPayableData?sum=amount&groupby=unique_id,company,vendor,billDate,dueDate,dueInDays,bdcUrl,onHold,ap_group,invoice_num&filter=ap_group in ["Mgt %26 Prop Co"]`);
  getSummaryTableDetailData(`/data/v1/accountsPayableData?sum=amount&unique=unique_id&groupby=company&fields=company,amount,unique_id&filter=ap_group in ["Mgt %26 Prop Co"]`);
};

// FUNCTION TO DISPLAY DEV & OTHER CO TABLE
function devAndOther() {
  getTabTableData(`/data/v1/accountsPayableData?sum=amount&groupby=unique_id,company,vendor,billDate,dueDate,dueInDays,bdcUrl,onHold,ap_group,invoice_num&filter=ap_group in ["Fund, Dev %26 Other"]`);
  getSummaryTableDetailData(`/data/v1/accountsPayableData?sum=amount&unique=unique_id&groupby=company&fields=company,amount,unique_id&filter=ap_group in ["Fund, Dev %26 Other"]`);
};


// ===================== UTILITIES =====================
// DECLARE VAR FOR NUMBER OF SPINS OCCURING SO ALL TASKS COMPLETE BEFORE SPINNER IS GONE
let spins = 0;

// FUNCTION TO FORMAT NUMBERS TO CURRENCY
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});
// FUNCTION RETURNS VALUE FOR CURRENCY CALCS
function displayCurrency(num) {
  return formatter.format(Math.round(parseFloat(num))).replace(/\D00(?=\D*$)/,'');
};

// FUNCTIONS TO CONTROL LOADING OF SCREEN
function startLoad() {
  spins ++;
  const container = document.querySelector('.container');
  container.style.display = 'none';
  const spinner = document.getElementById('spinner');
  spinner.style.display = 'block';
};
function endLoad() {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spins --;
    if(spins === 0) {
      spinner.style.display = 'none';
      const container = document.querySelector('.container');
      container.style.display = '';
    };
  };
  return false;
};

// UPDATE FOOTER
(function changeFooterYear() {
  let date = new Date();
  let year = date.getFullYear();
  footerYear.innerHTML = year;
})();

// FUNCTION TO ADD THOUSANDS SEPARATOR
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// FUNCTION TO REPLACE CURRENCY SYMBOL AND RETRIEVE A FLOAT OR INTEGER
function replaceCurrency(num) {
  return num.replace(/[$,]+/g,"");
};


// ===================== NAVBAR ITEMS =====================

// REMOVE CLASSES
function removeClass(className) {
  const items = Array.from(document.querySelectorAll(`.${className}`));
  items.forEach(item => {
    document.getElementById(item.id).classList.remove(className);
  });
};
// ADD CLASSES
function addClass(id, className) {
  document.getElementById(id).classList.add(className);
};
// FUNCTION FOR CLICKING ON NAVBAR LINKS
function navClicked(e) {
  if(e.target.id === 'mgt-prop-link') {
      mgtAndProp();
      // filterBar.style.display = 'none';
  } else if(e.target.id === 'dev-other-link') {
      devAndOther();
      // filterBar.style.display = 'none';
  } else if(e.target.id === 'summary-link') {
      init();
      // filterBar.style.display = '';
  } else if(e.target.id === 'paid-invoices-link') {
      document.querySelector('.container').innerHTML = '<h1>Still under development...</h1>';
      // filterBar.style.display = 'none';
  };

  removeClass('selected');
  addClass(e.target.id, 'selected');
  
  e.preventDefault();
};


// ===================== DATA TABLE ITEMS =====================

// PAINT SUMMARY TABLE
function paintSummaryTable(data) {
  dataTable.innerHTML = '';
  let totComp = data.length;
  let invDue = 0;
  let amtDue = 0;
  let invToPay = 0;
  let amtToPay = 0;
  let htmlToAdd = `
        <thead>
          <th>Category</th>
          <th>Group</th>
          <th>Company</th>
          <th>Total Inv Due</th>
          <th>Total Amt Due</th>
          <th>Inv Recommended</th>
          <th>Amt Recommended</th>
          <th>Inv Approved</th>
          <th>Amt Approved</th>
          <th>Inv Remaining</th>
          <th>Amt Remaining</th>
        </thead>
        <tbody>`;

  data.forEach(company => {
    htmlToAdd += `
    <tr id="row-${company.company}" class="data-table-row${company.invToPay ? ' recommended' : ''}">
      <td class="company-category">${company.ap_group}</td>
      <td class="company-group">${company.company_group}</td>
      <td class="company">${company.company}</td>
      <td class="inv-due">${formatNumber(company.unique_id)}</td>
      <td class="amt-due">${displayCurrency(company.amount)}</td>
      <td class="inv-rec">${company.invToPay ? formatNumber(company.invToPay) : '0'}</td>
      <td class="amt-rec">${company.recForPmt ? displayCurrency(company.recForPmt) : '$0'}</td>
      <td class="inv-apr">0</td>
      <td class="amt-apr">$0</td>
      <td class="inv-rem">${company.invToPay ? formatNumber(company.unique_id - company.invToPay) : formatNumber(company.unique_id)}</td>
      <td class="amt-rem">${company.recForPmt ? displayCurrency(company.amount - company.recForPmt) : displayCurrency(company.amount)}</td>
    </tr>`;
    invDue += company.unique_id;
    amtDue += company.amount;
    if(company.invToPay) {
      invToPay += company.invToPay;
    };
    if(company.recForPmt) {
      amtToPay += company.recForPmt;
    };
  });

  htmlToAdd += `
      <tr class="total-row">
        <td class="company-category">Total</td>
        <td class="company-group">${totComp}</td>
        <td class="company">${totComp}</td>
        <td class="tot-inv-due">${formatNumber(invDue)}</td>
        <td class="tot-amt-due">${displayCurrency(amtDue)}</td>
        <td class="tot-inv-rec">${formatNumber(invToPay)}</td>
        <td class="tot-amt-rec">${displayCurrency(amtToPay)}</td>
        <td class="tot-inv-apr">0</td>
        <td class="tot-amt-apr">$0</td>
        <td class="tot-inv-rem">${formatNumber(invDue - invToPay)}</td>
        <td class="tot-amt-rem">${displayCurrency(Math.round(amtDue) - Math.round(amtToPay))}</td>
      </tr>
    </tbody>
  `;
  dataTable.innerHTML = htmlToAdd;
  endLoad();
};

// PAINT MGT TABLE
function paintTabTable(data) {
  dataTable.innerHTML = '';
  let htmlToAdd = `
    <thead>
      <th>Pay?</th>
      <th>Amt to Pay</th>
      <th>Amt Remaining</th>
      <th>Status</th>
      <th>Days Past Due</th>
      <th>Company</th>
      <th>Vendor Name</th>
      <th>Invoice Desc</th>
      <th>Bill.com</th>
      <th>Total Amt Due</th>
      <th>Approved?</th>
    </thead>
    <tbody>
  `;

  data.forEach(inv => {
    htmlToAdd += `
      <tr id="${inv.recommended ? inv.objId : 'row-' + inv.unique_id}" class="data-table-row${inv.recommended ? ' recommended' : ''}">
        <td><input type="checkbox" class="recommend-check" id="rec-${inv.unique_id}"${inv.recommended ? ' checked' : ''}></td>
        <td class="to-pay">${inv.amtToPay ? displayCurrency(inv.amtToPay) : '$0'}</td>
        <td class="amt-remaining">${inv.recommended ? displayCurrency(Math.round(inv.amount) - Math.round(inv.amtToPay)) : displayCurrency(inv.amount)}</td>
        <td>${inv.status}</td>
        <td>${inv.dueInDays < 0 ? 'N/A' : inv.dueInDays}</td>
        <td class="company" id="${inv.ap_group}">${inv.company}</td>
        <td class ="vendor">${inv.vendor}</td>
        <td class ="description">${inv.invoice_num}</td>
        <td>${inv.bdcUrl ? '<a href="' + inv.bdcUrl + '" target="_blank">' + inv.unique_id + '</a>' : ''}</td>
        <td class="tot-amt">${displayCurrency(inv.amount)}</td>
        <td class="approval-cell${inv.approved ? ' approved' : ''}">${inv.approved ? 'Approved' : ''}</td>
      </tr>
    `;
  });

  htmlToAdd += `</tbody>`
  dataTable.innerHTML = htmlToAdd;
  endLoad();
};

// FUNCTION TO DISPLAY SUMMARY TABLE
function displaySummaryTab(data) {
  summaryTable.innerHTML = '';
  let htmlToAdd = `
    <thead>
      <th>Category</th>
      <th>Invoices Due</th>
      <th>Amount Due</th>
      <th>Invoices Recommended</th>
      <th>Amount Recommended</th>
      <th>Invoices Approved</th>
      <th>Amount Approved</th>
      <th>Invoices Remaining</th>
      <th>Amount Remaining</th>
    </thead>
    <tbody>
  `;
  let inv = 0;
  let amtDue = 0;
  let invRec = 0;
  let amtRec = 0;
  let invRem = 0;
  let amtRem = 0;

  data.forEach(item => {
    htmlToAdd += `
      <tr>
        <td>${item.apGroup}</td>
        <td>${formatNumber(item.invoicesDue)}</td>
        <td>${displayCurrency(item.amountDue)}</td>
        <td>${item.invoicesRecommended ? formatNumber(item.invoicesRecommended) : '0'}</td>
        <td>${item.amountRecommended ? displayCurrency(item.amountRecommended) : '$0'}</td>
        <td>0</td>
        <td>$0</td>
        <td>${item.invoicesRecommended ? formatNumber(item.invoicesDue - item.invoicesRecommended) : formatNumber(item.invoicesDue)}</td>
        <td>${item.amountRecommended ? displayCurrency(Math.round(item.amountDue) - Math.round(item.amountRecommended)) : displayCurrency(item.amountDue)}</td>
      </tr>
    `;
    inv += parseFloat(item.invoicesDue);
    amtDue += parseFloat(item.amountDue);
    if(item.invoicesRecommended) {
      invRec += parseFloat(item.invoicesRecommended);
    };
    if(item.amountRecommended) {
      amtRec += parseFloat(item.amountRecommended);
    };
  });

  htmlToAdd += `
    <tr class="total-row">
      <td>Total</td>
      <td>${formatNumber(inv)}</td>
      <td>${displayCurrency(amtDue)}</td>
      <td>${formatNumber(invRec)}</td>
      <td>${displayCurrency(amtRec)}</td>
      <td>0</td>
      <td>$0</td>
      <td>${formatNumber(inv - invRec)}</td>
      <td>${displayCurrency(Math.round(amtDue) - Math.round(amtRec))}</td>
    </tr>
  </tbody>
  `;
  summaryTable.innerHTML = htmlToAdd;
  showSummary();
  endLoad();
};


// FUNCTION TO DISPLAY SUMMARY TABLE - DETAIL PAGES
function displaySummaryTabDetail(data) {
  summaryTable.innerHTML = '';
  let htmlToAdd = `
    <thead>
      <th>Company</th>
      <th>Invoices Due</th>
      <th>Amount Due</th>
      <th>Invoices Recommended</th>
      <th>Amount Recommended</th>
      <th>Invoices Approved</th>
      <th>Amount Approved</th>
      <th>Invoices Remaining</th>
      <th>Amount Remaining</th>
    </thead>
    <tbody>
  `;
  let inv = 0;
  let amtDue = 0;
  let invRec = 0;
  let amtRec = 0;
  let invRem = 0;
  let amtRem = 0;

  data.forEach(item => {
    htmlToAdd += `
      <tr id="summary-${item.company}" class="summary-row${item.invoicesRecommended ? ' recommended' : ''}">
        <td class="company">${item.company}</td>
        <td class="inv">${formatNumber(item.unique_id)}</td>
        <td class="amt">${displayCurrency(item.amount)}</td>
        <td class="inv-rec">${item.invoicesRecommended ? formatNumber(item.invoicesRecommended) : '0'}</td>
        <td class="amt-rec">${item.amountRecommended ? displayCurrency(item.amountRecommended) : '$0'}</td>
        <td class="inv-apr">0</td>
        <td class="amt-apr">$0</td>
        <td class="inv-rem">${item.invoicesRecommended ? formatNumber(item.unique_id - item.invoicesRecommended) : formatNumber(item.unique_id)}</td>
        <td class="amt-rem">${item.amountRecommended ? displayCurrency(Math.round(item.amount) - Math.round(item.amountRecommended)) : displayCurrency(item.amount)}</td>
      </tr>
    `;
    inv += parseFloat(item.unique_id);
    amtDue += parseFloat(item.amount);
    if(item.invoicesRecommended) {
      invRec += parseFloat(item.invoicesRecommended);
    };
    if(item.amountRecommended) {
      amtRec += parseFloat(item.amountRecommended);
    };
    if(item.invoicesRecommended) {
      invRem += parseFloat(item.unique_id) - parseFloat(item.invoicesRecommended);
    } else {
      invRem += parseFloat(item.unique_id);
    };
    if(item.amountRecommended) {
      amtRem += Math.round(parseFloat(item.amount)) - Math.round(parseFloat(item.amountRecommended));
    } else {
      amtRem += parseFloat(item.amount);
    };
  });

  htmlToAdd += `
    <tr class="total-row" id="total-detail-summary">
      <td class="total-label">Total</td>
      <td class="total-inv">${formatNumber(inv)}</td>
      <td class="total-amt">${displayCurrency(amtDue)}</td>
      <td class="total-inv-rec">${formatNumber(invRec)}</td>
      <td class="total-amt-rec">${displayCurrency(amtRec)}</td>
      <td class="total-inv-apr">0</td>
      <td class="total-amt-apr">$0</td>
      <td class="total-inv-rem">${formatNumber(invRem)}</td>
      <td class="total-amt-rem">${displayCurrency(amtRem)}</td>
    </tr>
  </tbody>
  `;
  summaryTable.innerHTML = htmlToAdd;
  hideSummary();
  endLoad();
};


// ===================== FUNCTIONS FOR UI INTERACTIONS =====================

// FILTER BAR
// function filterList(e) {
//   const text = e.target.value.toLowerCase();
//   let company = '';
//   let group = '';
//   let category = '';
//   let newAmt = 0;
//   let amount = '';

//   for (i = 1; i < tableRow.length; i++) {
//     let row = tableRow[i];

//     let compEl = row.getElementsByClassName('company');
//     let groupEl = row.getElementsByClassName('company-group');
//     let categoryEl = row.getElementsByClassName('company-category');
//     let amtEl = row.getElementsByClassName('amount');

//     company = compEl.length !== 0 ? compEl[0].innerText : '';
//     group = groupEl.length !== 0 ? groupEl[0].innerText : '';
//     category = categoryEl.length !== 0 ? categoryEl[0].innerText : '';
//     amount = amtEl.length !==0 ? amtEl[0].innerText : '';

//     if(company.toLowerCase().indexOf(text) !== -1 || group.toLowerCase().indexOf(text) !== -1 || category.toLowerCase().indexOf(text) !== -1) {
//       row.style.display = '';
//       newAmt += parseFloat(amount.replace(/[$,]+/g,""));
//     } else {
//       row.style.display = 'none';
//     };
//   };

//   let newRemaining = newAmt - parseFloat(amtToPayHead.innerText.replace(/[$,]+/g,""))

//   totalDue.innerHTML = displayCurrency(newAmt);
//   amtRemainingHead.innerHTML = displayCurrency(newRemaining);

//   e.preventDefault();
// };

// CHECKING OF CHECKBOXES
function checkBoxCheck(e) {
  if(e.target.classList.contains('recommend-check')) {
    if(e.target.checked) {
      if(!e.target.parentElement.parentElement.classList.contains('recommended')) {
        e.target.parentElement.parentElement.classList.add('recommended');
        const pay = e.target.parentElement.parentElement.getElementsByClassName('to-pay')[0];
        const amt = e.target.parentElement.parentElement.getElementsByClassName('tot-amt')[0];
        const amtRemaining = e.target.parentElement.parentElement.getElementsByClassName('amt-remaining')[0];
        const compGroup = e.target.parentElement.parentElement.getElementsByClassName('company')[0];
        const recordId = e.target.parentElement.parentElement.id;

        pay.innerHTML = amt.innerText;
        amtRemaining.innerHTML = '$0';
        
        const payParsed = parseFloat(replaceCurrency(pay.innerText));
        const amtParsed = parseFloat(replaceCurrency(amt.innerText));
        const amtRemainingParsed = parseFloat(replaceCurrency(amtRemaining.innerText));
        const recordIdParsed = recordId.substring(4);
        const companyParsed = compGroup.innerText;
        const tabRows = summaryTable.getElementsByTagName('tr');
        for(i = 0; i < tabRows.length; i++) {
          if(tabRows[i].id === `summary-${companyParsed}`) {
            // Update Summary Table Company Row
            // Invoices Recommended
            const invCell = tabRows[i].getElementsByClassName('inv-rec')[0];
            let curInv = parseInt(invCell.innerHTML.replace(',','')) + 1;
            invCell.innerHTML = formatNumber(curInv);
            // Amount Recommended
            const amtCell = tabRows[i].getElementsByClassName('amt-rec')[0];
            let curAmt = parseFloat(replaceCurrency(amtCell.innerHTML)) + payParsed;
            amtCell.innerHTML = displayCurrency(curAmt);
            // Invoices Remaining
            const remInvCell = tabRows[i].getElementsByClassName('inv-rem')[0];
            let remInv = parseInt(remInvCell.innerHTML.replace(',','')) - 1;
            remInvCell.innerHTML = formatNumber(remInv);
            // Amount remaining
            const remAmtCell = tabRows[i].getElementsByClassName('amt-rem')[0];
            let remAmt = parseFloat(replaceCurrency(remAmtCell.innerHTML)) - payParsed;
            remAmtCell.innerHTML = displayCurrency(remAmt);
            
            // Update Total Row in UI Summary Table
            const totalIndex = tabRows.length - 1;
            const totRow = tabRows[totalIndex];
            // Total Invoices Recommended
            const totInvRec = totRow.getElementsByClassName('total-inv-rec')[0];
            const curTotInvRec = parseInt(totInvRec.innerHTML.replace(',','')) + 1;
            totInvRec.innerHTML = formatNumber(curTotInvRec);
            // Total Amount Recommended
            const totAmtRec = totRow.getElementsByClassName('total-amt-rec')[0];
            const curTotAmtRec = parseFloat(replaceCurrency(totAmtRec.innerHTML)) + payParsed;
            totAmtRec.innerHTML = displayCurrency(curTotAmtRec);
            // Total Invoices Remaining
            const totInvRem = totRow.getElementsByClassName('total-inv-rem')[0];
            const curTotInvRem = parseInt(totInvRem.innerHTML.replace(',','')) - 1;
            totInvRem.innerHTML = formatNumber(curTotInvRem);
            // Total Amount Remaining
            const totAmtRem = totRow.getElementsByClassName('total-amt-rem')[0];
            const curTotAmtRem = parseFloat(replaceCurrency(totAmtRem.innerHTML)) - payParsed;
            totAmtRem.innerHTML = displayCurrency(curTotAmtRem);

            // Update row class to include recommended if it doesn't already have
            if(!tabRows[i].classList.contains('recommended')) {
              tabRows[i].classList.add('recommended');
            };
            // Break loop to avoid unnecessary looping once the company is found
            break;
          };
        };

        // Create object to send to save invoice function to save to collection
        const apGroup = compGroup.id;
        const uniqueId = recordIdParsed;
        const amtToPay = payParsed;
        const totalInvAmt = parseFloat(replaceCurrency(amt.innerText));
        const rightNow = new Date();
        const recForPmtTimestamp = rightNow.toISOString();
        const company = companyParsed;
        const invoiceData = {
          ap_group: apGroup,
          company: company,
          unique_id: uniqueId,
          amt_to_pay: amtToPay,
          total_inv_amt: totalInvAmt,
          rec_for_pmt_timestamp: recForPmtTimestamp
        };

        saveInvoiceToDatabase(invoiceData, `row-${uniqueId}`);
      };
    } else {
      if(e.target.parentElement.parentElement.classList.contains('recommended')) {
        e.target.parentElement.parentElement.classList.remove('recommended');
        const pay = e.target.parentElement.parentElement.getElementsByClassName('to-pay')[0];
        const amt = e.target.parentElement.parentElement.getElementsByClassName('tot-amt')[0];
        const amtRemaining = e.target.parentElement.parentElement.getElementsByClassName('amt-remaining')[0];
        const recordId = e.target.parentElement.parentElement.id;
        const id = e.target.id;
        const compGroup = e.target.parentElement.parentElement.getElementsByClassName('company')[0];

        const payParsed = parseFloat(replaceCurrency(pay.innerText));
        const amtParsed = parseFloat(replaceCurrency(amt.innerText));
        const companyParsed = compGroup.innerText;
        const recordIdParsed = id.substring(4);
        const tabRows = summaryTable.getElementsByTagName('tr');
        for(i = 0; i < tabRows.length; i++) {
          if(tabRows[i].id === `summary-${companyParsed}`) {
            // Update Summary Table Company Row
            // Invoices Recommended
            const invCell = tabRows[i].getElementsByClassName('inv-rec')[0];
            let curInv = parseInt(invCell.innerHTML.replace(',','')) - 1;
            invCell.innerHTML = formatNumber(curInv);
            // Amount Recommended
            const amtCell = tabRows[i].getElementsByClassName('amt-rec')[0];
            let curAmt = parseFloat(replaceCurrency(amtCell.innerHTML)) - payParsed;
            amtCell.innerHTML = displayCurrency(curAmt);
            // Invoices Remaining
            const remInvCell = tabRows[i].getElementsByClassName('inv-rem')[0];
            let remInv = parseInt(remInvCell.innerHTML.replace(',','')) + 1;
            remInvCell.innerHTML = formatNumber(remInv);
            // Amount remaining
            const remAmtCell = tabRows[i].getElementsByClassName('amt-rem')[0];
            let remAmt = parseFloat(replaceCurrency(remAmtCell.innerHTML)) + payParsed;
            remAmtCell.innerHTML = displayCurrency(remAmt);
            
            // Update Total Row in UI Summary Table
            const totalIndex = tabRows.length - 1;
            const totRow = tabRows[totalIndex];
            // Total Invoices Recommended
            const totInvRec = totRow.getElementsByClassName('total-inv-rec')[0];
            const curTotInvRec = parseInt(totInvRec.innerHTML.replace(',','')) - 1;
            totInvRec.innerHTML = formatNumber(curTotInvRec);
            // Total Amount Recommended
            const totAmtRec = totRow.getElementsByClassName('total-amt-rec')[0];
            const curTotAmtRec = parseFloat(replaceCurrency(totAmtRec.innerHTML)) - payParsed;
            totAmtRec.innerHTML = displayCurrency(curTotAmtRec);
            // Total Invoices Remaining
            const totInvRem = totRow.getElementsByClassName('total-inv-rem')[0];
            const curTotInvRem = parseInt(totInvRem.innerHTML.replace(',','')) + 1;
            totInvRem.innerHTML = formatNumber(curTotInvRem);
            // Total Amount Remaining
            const totAmtRem = totRow.getElementsByClassName('total-amt-rem')[0];
            const curTotAmtRem = parseFloat(replaceCurrency(totAmtRem.innerHTML)) + payParsed;
            totAmtRem.innerHTML = displayCurrency(curTotAmtRem);

            // Update row class to include recommended if it doesn't already have
            if(tabRows[i].classList.contains('recommended') && curInv === 0) {
              tabRows[i].classList.remove('recommended');
            };
            // Break loop to avoid unnecessary looping once the company is found
            break;
          };
        };

        pay.innerHTML = '$0';
        amtRemaining.innerHTML = displayCurrency(amtParsed);

        const record = recordIdParsed
        deleteInvoiceFromDatabase(recordId, record);
      };
    };
  };

  e.preventDefault();
};

// HIDE/SHOW SUMMARY TABLE
function toggleSummary(e) {
  if(summaryTable.style.display !== 'none') {
    hideSummary();
  } else {
    showSummary();
  };  
  e.preventDefault();
};
function hideSummary() {
  summaryTable.style.display = 'none';
  sumBtn.innerHTML = 'Show Summary';
};
function showSummary() {
  summaryTable.style.display = '';
  sumBtn.innerHTML = 'Hide Summary';
}

// GO BACK TO TOP BUTTON AND SCROLL FUNCTION 
window.onscroll = function() { scrollFunction() };

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    topBtn.style.display = 'block';
  } else {
    topBtn.style.display = 'none';
  };
};

function goToTop(e) {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  e.preventDefault();
};