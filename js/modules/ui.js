// Declare UI Variables
const summaryBtn = document.getElementById('summary-link');
const mgtBtn = document.getElementById('mgt-prop-link');
const devBtn = document.getElementById('dev-other-link');
const paidBtn = document.getElementById('paid-invoices-link');
const dataTable = document.getElementById('data-table');
// const totalDue = document.getElementById('total-amt-due');
// const filterBar = document.getElementById('filter');
const tableRow = dataTable.getElementsByTagName('tr');
// const amtToPayHead = document.getElementById('amt-to-pay-head');
// const amtRemainingHead = document.getElementById('amt-remaining-head');
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
  sumBtn.addEventListener('click', hideSummary);
})();

// UPDATE FOOTER
(function changeFooterYear() {
  let date = new Date();
  let year = date.getFullYear();
  footerYear.innerHTML = year;
})();


// ===================== UTILITIES =====================
// UTILITY VAR
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

// FUNCTION TO ADD THOUSANDS SEPARATOR
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


// ===================== DATA TABLE ITEMS =====================

// PAINT SUMMARY TABLE
function paintSummaryTable(data) {
  // document.getElementById('total-header').style.display = 'none';
  // document.getElementById('amt-to-pay-header').style.display = 'none';
  // document.getElementById('amt-remaining-header').style.display = 'none';
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
  // totalDue.innerHTML = '$0';
  // let totalAmt = 0;
  // let amtToPay = 0;
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
    // totalAmt += inv.amount;
    // if(inv.amtToPay) {
    //   amtToPay += inv.amtToPay;
    // };
    // document.getElementById('total-header').style.display = '';
    // document.getElementById('amt-to-pay-header').style.display = '';
    // document.getElementById('amt-remaining-header').style.display = '';
  });

  htmlToAdd += `</tbody>`
  dataTable.innerHTML = htmlToAdd;
  // totalDue.innerHTML = displayCurrency(totalAmt);
  // amtToPayHead.innerHTML = displayCurrency(amtToPay);
  // amtRemainingHead.innerHTML = displayCurrency(totalAmt - amtToPay);
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
        <td>0</td>
        <td>$0</td>
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
      <td>0</td>
      <td>$0</td>
    </tr>
  </tbody>
  `;
  summaryTable.innerHTML = htmlToAdd;
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

  data.forEach(item => {
    htmlToAdd += `
      <tr>
        <td>${item.company}</td>
        <td>${formatNumber(item.unique_id)}</td>
        <td>${displayCurrency(item.amount)}</td>
        <td>${item.invoicesRecommended ? formatNumber(item.invoicesRecommended) : '0'}</td>
        <td>${item.amountRecommended ? displayCurrency(item.amountRecommended) : '$0'}</td>
        <td>0</td>
        <td>$0</td>
        <td>0</td>
        <td>$0</td>
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
      <td>0</td>
      <td>$0</td>
    </tr>
  </tbody>
  `;
  summaryTable.innerHTML = htmlToAdd;
  endLoad();
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
    if(!e.target.classList.contains('selected')) {
      getTabTableData(`/data/v1/accountsPayableData?sum=amount&groupby=unique_id,company,vendor,billDate,dueDate,dueInDays,bdcUrl,onHold,ap_group,invoice_num&filter=ap_group in ["Mgt %26 Prop Co"]`);
      getSummaryTableDetailData(`/data/v1/accountsPayableData?sum=amount&unique=unique_id&groupby=company&fields=company,amount,unique_id&filter=ap_group in ["Mgt %26 Prop Co"]`)
      // filterBar.style.display = 'none';
    }
  } else if(e.target.id === 'dev-other-link') {
    if(!e.target.classList.contains('selected')) {
      getTabTableData(`/data/v1/accountsPayableData?sum=amount&groupby=unique_id,company,vendor,billDate,dueDate,dueInDays,bdcUrl,onHold,ap_group,invoice_num&filter=ap_group in ["Fund, Dev %26 Other"]`);
      // filterBar.style.display = 'none';
    }
  } else if(e.target.id === 'summary-link') {
    if(!e.target.classList.contains('selected')) {
      getSummaryTableData(`/sql/v1/accountsPayableData`, `SELECT company_ap_group, COUNT(DISTINCT \`unique_id\`), SUM(\`Amount Left To Pay\`) FROM accountsPayableData GROUP BY company_ap_group`);
      getInitTableData(`/data/v1/accountsPayableData?sum=amount&groupby=company,company_group,ap_group`);
      // filterBar.style.display = '';
    }
  } else if(e.target.id === 'paid-invoices-link') {
    if(!e.target.classList.contains('selected')) {
      
    }
  };

  removeClass('selected');
  addClass(e.target.id, 'selected');
  
  e.preventDefault();
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
        let pay = e.target.parentElement.parentElement.getElementsByClassName('to-pay')[0];
        let amt = e.target.parentElement.parentElement.getElementsByClassName('tot-amt')[0];
        let amtRemaining = e.target.parentElement.parentElement.getElementsByClassName('amt-remaining')[0];
        let compGroup = e.target.parentElement.parentElement.getElementsByClassName('company')[0];
        let recordId = e.target.parentElement.parentElement.id;

        pay.innerHTML = amt.innerText;
        amtRemaining.innerHTML = '$0';
        
        const payHead = parseFloat(pay.innerText.replace(/[$,]+/g,""));
        // const currentPayHead = parseFloat(amtToPayHead.innerText.replace(/[$,]+/g,""));
        // const newAmtToPay = payHead + currentPayHead
        // amtToPayHead.innerHTML = displayCurrency(newAmtToPay);

        // const currentTotal = parseFloat(totalDue.innerText.replace(/[$,]+/g,""));
        // const newRemaining = currentTotal - newAmtToPay;

        // amtRemainingHead.innerHTML = displayCurrency(newRemaining);

        const apGroup = compGroup.id;
        const uniqueId = recordId.substring(4);
        const amtToPay = payHead;
        const totalInvAmt = parseFloat(amt.innerText.replace(/[$,]+/g,""));
        const rightNow = new Date();
        const recForPmtTimestamp = rightNow.toISOString();
        const company = compGroup.innerText;
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

        const payHead = parseFloat(pay.innerText.replace(/[$,]+/g,""));
        // const currentPayHead = parseFloat(amtToPayHead.innerText.replace(/[$,]+/g,""));
        // const newAmtToPay = currentPayHead - payHead
        // amtToPayHead.innerHTML = displayCurrency(newAmtToPay);

        // const currentTotal = parseFloat(totalDue.innerText.replace(/[$,]+/g,""));
        // const newRemaining = currentTotal - newAmtToPay;

        // amtRemainingHead.innerHTML = displayCurrency(newRemaining);

        pay.innerHTML = '$0';
        amtRemaining.innerHTML = amt.innerText;
        const record = id.substring(4);

        deleteInvoiceFromDatabase(recordId, record);
      };
    };
  };

  e.preventDefault();
};

// HIDE SUMMARY TABLE
function hideSummary(e) {
  if(summaryTable.style.display !== 'none') {
    summaryTable.style.display = 'none';
    sumBtn.innerHTML = 'Show Summary';
  } else {
    summaryTable.style.display = '';
    sumBtn.innerHTML = 'Hide Summary';
  };
  
  e.preventDefault()
};

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