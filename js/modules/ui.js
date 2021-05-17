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
const approveBtn = document.getElementById('approveBtn');
const unapproveBtn = document.getElementById('unapproveBtn');
const modal = document.getElementById('modal-div');
const modalText = document.getElementById('modal-text');
const modalBtn = document.querySelector('.modal-btn');
const closeModal = document.getElementById('close-modal');

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
  approveBtn.addEventListener('click', approveInvoices);
  modalBtn.addEventListener('click', modalBtnClick);
  closeModal.addEventListener('click', hideModal);
  unapproveBtn.addEventListener('click', unapproveInvoices);
})();


// ===================== DATA.JS CALLS =====================

// FUNCTION TO DISPLAY SUMMARY TABLE
function init() {
  isApprover();
  getSummaryTableData(`/sql/v1/accountsPayableData`, `SELECT company_ap_group, COUNT(DISTINCT CONCAT(\`unique_id\`,\`Community\`)), SUM(\`Amount Left To Pay\`) FROM accountsPayableData GROUP BY company_ap_group`);
  getInitTableData(`/data/v1/accountsPayableData?sum=amount&unique=unique_id&groupby=company,company_group,ap_group&fields=company,company_group,ap_group,amount,unique_id`);
};

// FUNCTION TO DISPLAY MGT & PROP TABLE
function mgtAndProp() {
  isApprover();
  getTabTableData(`/data/v1/accountsPayableData?sum=amount&groupby=unique_id,company,vendor,billDate,dueDate,dueInDays,bdcUrl,onHold,ap_group,invoice_num&filter=ap_group in ["Mgt %26 Prop Co"]`);
  getSummaryTableDetailData(`/data/v1/accountsPayableData?sum=amount&unique=unique_id&groupby=company&fields=company,amount,unique_id&filter=ap_group in ["Mgt %26 Prop Co"]`);
};

// FUNCTION TO DISPLAY DEV & OTHER CO TABLE
function devAndOther() {
  isApprover();
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

// FUNCTION TO ENABLE/DISABLE CHECKBOX SO TWO FUNCTIONS DO NOT RUN AT ONCE
function toggleCheckbox(e) {
  const isActive = e.target.disabled;
  if(!isActive) {
    e.target.disabled = true;
  } else {
    e.target.disabled = false;
  };
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
      
      // filterBar.style.display = 'none';
  };

  removeClass('selected');
  addClass(e.target.id, 'selected');
  
  e.preventDefault();
};


// ===================== DATA TABLE ITEMS =====================

// FUNCTION TO DISPLAY SUMMARY TABLE ON SUMMARY TAB
function displaySummaryTab(data) {
  summaryTable.innerHTML = '';
  let htmlToAdd = `
    <thead>
      <tr>
        <th>Category</th>
        <th>Invoices Due</th>
        <th>Amount Due</th>
        <th>Invoices Recommended</th>
        <th>Amount Recommended</th>
        <th>Invoices Approved</th>
        <th>Amount Approved</th>
        <th>Invoices Remaining</th>
        <th>Amount Remaining</th>
      </tr>
    </thead>
    <tbody>
  `;
  let inv = 0;
  let amtDue = 0;
  let invRec = 0;
  let amtRec = 0;
  let invApr = 0;
  let amtApr = 0;

  data.forEach(item => {
    htmlToAdd += `
      <tr>
        <td>${item.apGroup}</td>
        <td>${formatNumber(item.invoicesDue)}</td>
        <td>${displayCurrency(item.amountDue)}</td>
        <td class="${item.invoicesRecommended ? ' recommended' : ''}">${item.invoicesRecommended ? formatNumber(item.invoicesRecommended) : '0'}</td>
        <td class="${item.amountRecommended ? ' recommended' : ''}">${item.amountRecommended ? displayCurrency(item.amountRecommended) : '$0'}</td>
        <td class="${item.approved ? ' approved' : ''}">${item.approved ? formatNumber(item.approved) : '0'}</td>
        <td class="${item.approvedAmount ? ' approved' : ''}">${item.approvedAmount ? displayCurrency(item.approvedAmount) : '$0'}</td>
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
    if(item.approved) {
      invApr += parseFloat(item.approved);
    };
    if(item.approvedAmount) {
      amtApr += parseFloat(item.approvedAmount);
    };
  });

  htmlToAdd += `
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>Total</td>
        <td>${formatNumber(inv)}</td>
        <td>${displayCurrency(amtDue)}</td>
        <td>${formatNumber(invRec)}</td>
        <td>${displayCurrency(amtRec)}</td>
        <td>${formatNumber(invApr)}</td>
        <td>${displayCurrency(amtApr)}</td>
        <td>${formatNumber(inv - invRec)}</td>
        <td>${displayCurrency(Math.round(amtDue) - Math.round(amtRec))}</td>
      </tr>
    </tfoot>
  `;
  summaryTable.innerHTML = htmlToAdd;
  showSummary();
  endLoad();
};

// FUNCTION TO DISPLAY MAIN TABLE ON SUMMARY TAB
function paintSummaryTable(data) {
  destroyTable();
  dataTable.innerHTML = '';
  let totComp = data.length;
  let invDue = 0;
  let amtDue = 0;
  let invToPay = 0;
  let amtToPay = 0;
  let invApr = 0;
  let amtApr = 0;
  let htmlToAdd = `
        <thead>
          <tr>
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
          </tr>
        </thead>
        <tbody>`;

  data.forEach(company => {
    htmlToAdd += `
    <tr id="row-${company.company}" class="data-table-row">
      <td class="company-category">${company.ap_group}</td>
      <td class="company-group">${company.company_group}</td>
      <td class="company">${company.company}</td>
      <td class="inv-due">${formatNumber(company.unique_id)}</td>
      <td class="amt-due">${displayCurrency(company.amount)}</td>
      <td class="inv-rec${company.invToPay ? ' recommended' : ''}">${company.invToPay ? formatNumber(company.invToPay) : '0'}</td>
      <td class="amt-rec${company.recForPmt ? ' recommended' : ''}">${company.recForPmt ? displayCurrency(company.recForPmt) : '$0'}</td>
      <td class="inv-apr${company.approved ? ' approved' : ''}">${company.approved ? formatNumber(company.approved) : '0'}</td>
      <td class="amt-apr${company.approvedAmount ? ' approved' : ''}">${company.approvedAmount ? displayCurrency(company.approvedAmount) : '$0'}</td>
      <td class="inv-rem">${company.invToPay ? formatNumber(company.unique_id - company.invToPay) : formatNumber(company.unique_id)}</td>
      <td class="amt-rem">${company.recForPmt ? displayCurrency(company.amount - company.recForPmt) : displayCurrency(company.amount)}</td>
    </tr>`;
    // COMMENTED OUT BECAUSE ONLY USED IN TOTAL ROW =============================
    // invDue += company.unique_id;
    // amtDue += company.amount;
    // if(company.invToPay) {
    //   invToPay += company.invToPay;
    // };
    // if(company.recForPmt) {
    //   amtToPay += company.recForPmt;
    // };
  });

  // IF WE NEED A TOTAL ROW, WE CAN USE THIS ===========================
  //   <tfoot>
  //   <tr class="total-row">
  //     <td class="company-category">Total</td>
  //     <td class="company-group">${totComp}</td>
  //     <td class="company">${totComp}</td>
  //     <td class="tot-inv-due">${formatNumber(invDue)}</td>
  //     <td class="tot-amt-due">${displayCurrency(amtDue)}</td>
  //     <td class="tot-inv-rec">${formatNumber(invToPay)}</td>
  //     <td class="tot-amt-rec">${displayCurrency(amtToPay)}</td>
  //     <td class="tot-inv-apr">0</td>
  //     <td class="tot-amt-apr">$0</td>
  //     <td class="tot-inv-rem">${formatNumber(invDue - invToPay)}</td>
  //     <td class="tot-amt-rem">${displayCurrency(Math.round(amtDue) - Math.round(amtToPay))}</td>
  //   </tr>
  // </tfoot>

  htmlToAdd += `
    </tbody>
  `;
  dataTable.innerHTML = htmlToAdd;
  loadFilters();
  endLoad();
};

// DETAIL TAB PAGES ===============================

// FUNCTION TO DISPLAY SUMMARY TABLE - DETAIL PAGES
function displaySummaryTabDetail(data) {
  summaryTable.innerHTML = '';
  let htmlToAdd = `
    <thead>
      <tr>
        <th>Company</th>
        <th>Invoices Due</th>
        <th>Amount Due</th>
        <th>Invoices Recommended</th>
        <th>Amount Recommended</th>
        <th>Invoices Approved</th>
        <th>Amount Approved</th>
        <th>Invoices Remaining</th>
        <th>Amount Remaining</th>
      </tr>
    </thead>
    <tbody>
  `;
  let inv = 0;
  let amtDue = 0;
  let invRec = 0;
  let amtRec = 0;
  let invRem = 0;
  let amtRem = 0;
  let invApr = 0;
  let amtApr = 0;

  data.forEach(item => {
    let rec_class = '';
    let apr_class = '';
    if(item.invoicesRecommended) {
      rec_class = ' recommended';
    };
    if(item.approved) {
      apr_class = ' approved';
    };
    htmlToAdd += `
      <tr id="summary-${item.company}" class="summary-row">
        <td class="company">${item.company}</td>
        <td class="inv">${formatNumber(item.unique_id)}</td>
        <td class="amt">${displayCurrency(item.amount)}</td>
        <td class="inv-rec${rec_class}">${item.invoicesRecommended ? formatNumber(item.invoicesRecommended) : '0'}</td>
        <td class="amt-rec${rec_class}">${item.amountRecommended ? displayCurrency(item.amountRecommended) : '$0'}</td>
        <td class="inv-apr${apr_class}">${item.approved ? formatNumber(item.approved) : '0'}</td>
        <td class="amt-apr${apr_class}">${item.approvedAmount ? displayCurrency(item.approvedAmount) : '$0'}</td>
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
    if(item.approved) {
      invApr += parseFloat(item.approved);
    };
    if(item.approvedAmount) {
      amtApr += parseFloat(item.approvedAmount);
    };
  });

  htmlToAdd += `
    </tbody>
    <tfoot>
      <tr class="total-row" id="total-detail-summary">
        <td class="total-label">Total</td>
        <td class="total-inv">${formatNumber(inv)}</td>
        <td class="total-amt">${displayCurrency(amtDue)}</td>
        <td class="total-inv-rec">${formatNumber(invRec)}</td>
        <td class="total-amt-rec">${displayCurrency(amtRec)}</td>
        <td class="total-inv-apr">${formatNumber(invApr)}</td>
        <td class="total-amt-apr">${displayCurrency(amtApr)}</td>
        <td class="total-inv-rem">${formatNumber(invRem)}</td>
        <td class="total-amt-rem">${displayCurrency(amtRem)}</td>
      </tr>
    </tfoot>
  `;
  summaryTable.innerHTML = htmlToAdd;
  hideSummary();
  endLoad();
};

// FUNCTION TO DISPLAY DETAIL TABLE WITH INVOICE SELECTION ON DETAIL TABS
function paintTabTable(data) {
  destroyTable();
  dataTable.innerHTML = '';
  let htmlToAdd = `
    <thead>
      <tr>
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
      </tr>
    </thead>
    <tbody>
  `;

  data.forEach(inv => {
    let aprDate = '';
    inv.approval ? aprDate = new Date(inv.approval) : '';
    let row_class = '';
    if(inv.recommended && inv.approval) {
      row_class = ' approved'
    } else if(inv.recommended) {
      row_class = ' recommended'
    };
    htmlToAdd += `
      <tr id="${inv.recommended ? inv.objId : 'row-' + inv.unique_id}" class="data-table-row${row_class}">
        <td><input type="checkbox" class="recommend-check" id="rec-${inv.unique_id}"${inv.recommended ? ' checked' : ''}></td>
        <td class="to-pay">${inv.amtToPay ? displayCurrency(inv.amtToPay) : '$0'}</td>
        <td class="amt-remaining">${inv.recommended ? displayCurrency(Math.round(inv.amount) - Math.round(inv.amtToPay)) : displayCurrency(inv.amount)}</td>
        <td>${inv.status}</td>
        <td>${inv.dueInDays}</td>
        <td class="company" id="${inv.ap_group}">${inv.company}</td>
        <td class ="vendor">${inv.vendor}</td>
        <td class ="description">${inv.invoice_num}</td>
        <td>${inv.bdcUrl ? '<a href="' + inv.bdcUrl + '" target="_blank">' + inv.unique_id + '</a>' : ''}</td>
        <td class="tot-amt">${displayCurrency(inv.amount)}</td>
        <td class="approval-cell">${inv.approval ? aprDate.getMonth() + '/' + aprDate.getDay() + '/' + aprDate.getFullYear() : ''}</td>
      </tr>
    `;
  });

  htmlToAdd += `</tbody>`
  dataTable.innerHTML = htmlToAdd;
  loadFilters();
  endLoad();
};


// ===================== INVOICE APPROVAL FUNCTIONS =====================

// FUNCTION TO APPROVE ALL INVOICES
async function approveInvoices(e) {
  startLoad()
  const invDet = await getInvDetails()
  if(invDet.num) {
    const modTxt = `You are about to approve <span class="primary-text">${formatNumber(invDet.num)}</span> recommended invoices totaling <span class="primary-text">${displayCurrency(invDet.total)}</span>. <br><br> <span class="secondary-text">${invDet.inv ? formatNumber(invDet.inv) : '0'}</span> invoices totaling <span class="secondary-text">${invDet.amt ? displayCurrency(invDet.amt) : '$0'}</span> have already been approved.<br><br>Are you sure you want to continue?`
    const btTxt = `Yes - Approve ${formatNumber(invDet.num)} Invoices`
    const bId = 'approve'
    showModal(modTxt, btTxt, bId);
  } else {
    const modTxt = 'No invoices have been recommended for payment. Please select invoices to approve before clicking approve.';
    const btTxt = 'Okay';
    const bId = 'okay';
    showModal(modTxt, btTxt, bId);
  };
  endLoad();

  e.preventDefault();
};

// FUNCTION TO UNAPPROVE ALL INVOICES
async function unapproveInvoices(e) {
  startLoad();
  const invDet = await getInvDetails();
  if(invDet.inv) {
    const modTxt = `You are about to unapprove <span class="primary-text">${formatNumber(invDet.inv)}</span> approved invoices totaling <span class="primary-text">${displayCurrency(invDet.amt)}</span>. <br><br> Are you sure you want to continue?`;
    const btTxt = `Yes - Unapprove ${formatNumber(invDet.inv)} Invoices`;
    const bId = 'unapprove';
    showModal(modTxt, btTxt, bId);
  } else {
    const modTxt = 'There are no approved invoices to unapprove at the moment.';
    const btTxt = 'Okay';
    const bId = 'okay';
    showModal(modTxt, btTxt, bId);
  }
  endLoad();
  e.preventDefault();
}


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
    // Disable checkbox to avoid double click
    toggleCheckbox(e);
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
            if(!invCell.classList.contains('recommended')) {
              invCell.classList.add('recommended');
            };
            // Amount Recommended
            const amtCell = tabRows[i].getElementsByClassName('amt-rec')[0];
            let curAmt = parseFloat(replaceCurrency(amtCell.innerHTML)) + payParsed;
            amtCell.innerHTML = displayCurrency(curAmt);
            if(!amtCell.classList.contains('recommended')) {
              amtCell.classList.add('recommended');
            };
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

        saveInvoiceToDatabase(invoiceData, `row-${uniqueId}`, e);
      };
    } else {
      if(e.target.parentElement.parentElement.classList.contains('recommended') || e.target.parentElement.parentElement.classList.contains('approved')) {
        e.target.parentElement.parentElement.classList.remove('recommended');
        const pay = e.target.parentElement.parentElement.getElementsByClassName('to-pay')[0];
        const amt = e.target.parentElement.parentElement.getElementsByClassName('tot-amt')[0];
        const amtRemaining = e.target.parentElement.parentElement.getElementsByClassName('amt-remaining')[0];
        const recordId = e.target.parentElement.parentElement.id;
        const id = e.target.id;
        const compGroup = e.target.parentElement.parentElement.getElementsByClassName('company')[0];
        const aprCell = e.target.parentElement.parentElement.getElementsByClassName('approval-cell')[0];
        aprCell.innerHTML = '';

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
            if(invCell.classList.contains('recommended') && curInv === 0) {
              invCell.classList.remove('recommended');
            };
            // Amount Recommended
            const amtCell = tabRows[i].getElementsByClassName('amt-rec')[0];
            let curAmt = parseFloat(replaceCurrency(amtCell.innerHTML)) - payParsed;
            amtCell.innerHTML = displayCurrency(curAmt);
            if(amtCell.classList.contains('recommended') && curAmt === 0) {
              amtCell.classList.remove('recommended');
            };
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

            // Only edit approved if invoice is approved
            if(e.target.parentElement.parentElement.classList.contains('approved')) {
              // Invoices Approved
              const aprInvCell = tabRows[i].getElementsByClassName('inv-apr')[0];
              let curAprInv = parseInt(aprInvCell.innerHTML.replace(',','')) - 1;
              aprInvCell.innerHTML = formatNumber(curAprInv);
              if(aprInvCell.classList.contains('approved') && curAprInv === 0) {
                aprInvCell.classList.remove('approved');
              };
              // Amount Approved
              const aprAmtCell = tabRows[i].getElementsByClassName('amt-apr')[0];
              let curAprAmt = parseFloat(replaceCurrency(aprAmtCell.innerHTML)) - payParsed;
              aprAmtCell.innerHTML = displayCurrency(curAprAmt);
              if(aprAmtCell.classList.contains('approved') && curAprAmt === 0) {
                aprAmtCell.classList.remove('approved');
              };
              // Total Invoices Approved
              const totInvApr = totRow.getElementsByClassName('total-inv-apr')[0];
              const curTotInvApr = parseInt(totInvApr.innerHTML.replace(',','')) - 1;
              totInvApr.innerHTML = formatNumber(curTotInvApr);
              if(curTotInvApr === 0 && unapproveBtn) {
                unapproveBtn.style.display = 'none';
              };
              // Total Amount Approved
              const totAmtApr = totRow.getElementsByClassName('total-amt-apr')[0];
              const curTotAmtApr = parseFloat(replaceCurrency(totAmtApr.innerHTML)) - payParsed;
              totAmtApr.innerHTML = displayCurrency(curTotAmtApr);
              e.target.parentElement.parentElement.classList.remove('approved');
            };

            // Break loop to avoid unnecessary looping once the company is found
            break;
          };
        };

        pay.innerHTML = '$0';
        amtRemaining.innerHTML = displayCurrency(amtParsed);

        const record = recordIdParsed
        deleteInvoiceFromDatabase(recordId, record, e);
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

// HIDE AND SHOW MODAL FUNCTIONS
function showModal(text, btnText, btnId) {
  modalBtn.innerHTML = btnText;
  modalText.innerHTML = text;
  modalBtn.id = btnId;

  modal.style.display = 'block';
};

function hideModal(e) {
  modal.style.display = 'none';

  if(e) {
    e.preventDefault();
  };
};

function modalBtnClick(e) {
  if(e.target.id === 'approve') {
    approveAllInvoices();
  } else if(e.target.id === 'unapprove') {
    unapproveAllInvoices();
  };

  hideModal();

  e.preventDefault();
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