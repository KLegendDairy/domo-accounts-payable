// Declare UI Variables
const summaryBtn = document.getElementById('summary-link');
const mgtBtn = document.getElementById('mgt-prop-link');
const devBtn = document.getElementById('dev-other-link');
const paidBtn = document.getElementById('paid-invoices-link');
const dataTable = document.getElementById('data-table');
const totalDue = document.getElementById('total-amt-due');
const filterBar = document.getElementById('filter');
const tableRow = dataTable.getElementsByTagName('tr');
const amtToPayHead = document.getElementById('amt-to-pay-head');
const amtRemainingHead = document.getElementById('amt-remaining-head');

// LOAD EVENT LISTENERS
(function loadEventListeners() {
  summaryBtn.addEventListener('click', navClicked);
  mgtBtn.addEventListener('click', navClicked);
  devBtn.addEventListener('click', navClicked);
  paidBtn.addEventListener('click', navClicked);
  filterBar.addEventListener('keyup', filterList);
  dataTable.addEventListener('change', checkBoxCheck);
})();


// UTILITIES
// FUNCTION TO FORMAT NUMBERS TO CURRENCY
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});
// FUNCTION RETURNS VALUE FOR CURRENCY CALCS
function displayCurrency(num) {
  return formatter.format(Math.round(parseFloat(num))).replace(/\D00(?=\D*$)/,'');
};


// DATA TABLE ITEMS

// PAINT SUMMARY TABLE
function paintSummaryTable(data) {
  dataTable.innerHTML = '';
  totalDue.innerHTML = '$0';
  let totalAmt = 0;
  let htmlToAdd = `
        <thead>
          <th>Group</th>
          <th>Company</th>
          <th>Total Due</th>
          <th>Recommended to Pay</th>
          <th>Remaining Balance</th>
        </thead>`;

  data.forEach(company => {
    htmlToAdd += `
    <tr id="row-${company.company}" class="data-table-row">
      <td class="company-group">${company.company_group}</td>
      <td class="company">${company.company}</td>
      <td class="amount">${displayCurrency(company.amount)}</td>
      <td>$0</td>
      <td>${displayCurrency(company.amount)}</td>
    </tr>`;
    totalAmt += company.amount;
  });

  dataTable.innerHTML = htmlToAdd;
  totalDue.innerHTML = displayCurrency(totalAmt);
  amtRemainingHead.innerHTML = displayCurrency(totalAmt);
};

// PAINT MGT TABLE
function paintMgtTable(data) {
  dataTable.innerHTML = '';
  totalDue.innerHTML = '$0';
  let totalAmt = 0;
  let htmlToAdd = `
    <thead>
      <th>Pay?</th>
      <th>Amt to Pay</th>
      <th>Amt Remaining</th>
      <th>Status</th>
      <th>Days Past Due</th>
      <th>Company</th>
      <th>Vendor Name</th>
      <th>Bill.com</th>
      <th>Total Amt Due</th>
    </thead>
  `;

  data.forEach(inv => {
    htmlToAdd += `
      <tbody>
        <tr id="row-${inv.unique_id}" class="data-table-row">
          <td><input type="checkbox" class="recommend-check" id="rec-${inv.unique_id}"></td>
          <td class="to-pay">$0</td>
          <td class="amt-remaining">${displayCurrency(inv.amount)}</td>
          <td>${inv.status}</td>
          <td>${inv.dueInDays < 0 ? 'N/A' : inv.dueInDays}</td>
          <td class="company">${inv.company}</td>
          <td class ="vendor">${inv.vendor}</td>
          <td>${inv.bdcUrl ? '<a href="' + inv.bdcUrl + '" target="_blank">' + inv.unique_id + '</a>' : ''}</td>
          <td class="tot-amt">${displayCurrency(inv.amount)}</td>
        </tr>
      </tbody>
    `;
    totalAmt += inv.amount;
  });

  dataTable.innerHTML = htmlToAdd;
  totalDue.innerHTML = displayCurrency(totalAmt);
  amtRemainingHead.innerHTML = displayCurrency(totalAmt);

};


// NAVBAR ITEMS

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
      getMgtTableData(`/data/v1/accountsPayableData?sum=amount&groupby=unique_id,company,vendor,billDate,dueDate,dueInDays,bdcUrl,onHold&filter=ap_group in ["Mgt %26 Prop Co"]`);
    }
  } else if(e.target.id === 'dev-other-link') {
    if(!e.target.classList.contains('selected')) {
      
    }
  } else if(e.target.id === 'summary-link') {
    if(!e.target.classList.contains('selected')) {
      getInitTableData(`/data/v1/accountsPayableData?sum=amount&groupby=company,company_group`);
    }
  } else if(e.target.id === 'paid-invoices-link') {
    if(!e.target.classList.contains('selected')) {
      
    }
  };

  removeClass('selected');
  addClass(e.target.id, 'selected');
  
  e.preventDefault();
};


// FUNCTIONS FOR UI INTERACTIONS
// FILTER BAR
function filterList(e) {
  const text = e.target.value.toLowerCase();
  let company = '';
  let group = '';
  let newAmt = 0;

  for (i = 1; i < tableRow.length; i++) {
    let row = tableRow[i];

    let compEl = row.getElementsByClassName('company');
    let groupEl = row.getElementsByClassName('company-group');
    let amtEl = row.getElementsByClassName('amount');

    company = compEl.length !== 0 ? compEl[0].innerText : '';
    group = groupEl.length !== 0 ? groupEl[0].innerText : '';
    amount = amtEl.length !==0 ? amtEl[0].innerText : '';

    if(company.toLowerCase().indexOf(text) !== -1 || group.toLowerCase().indexOf(text) !== -1) {
      row.style.display = '';
      newAmt += parseFloat(amount.replace(/[$,]+/g,""));
    } else {
      row.style.display = 'none';
    };
  };

  let newRemaining = newAmt - parseFloat(amtToPayHead.innerText.replace(/[$,]+/g,""))

  totalDue.innerHTML = displayCurrency(newAmt);
  amtRemainingHead.innerHTML = displayCurrency(newRemaining);

  e.preventDefault();
};

// CHECKING OF CHECKBOXES
function checkBoxCheck(e) {
  if(e.target.classList.contains('recommend-check')) {
    if(e.target.checked) {
      if(!e.target.parentElement.parentElement.classList.contains('recommended')) {
        e.target.parentElement.parentElement.classList.add('recommended');
        let pay = e.target.parentElement.parentElement.getElementsByClassName('to-pay')[0];
        let amt = e.target.parentElement.parentElement.getElementsByClassName('tot-amt')[0];
        let amtRemaining = e.target.parentElement.parentElement.getElementsByClassName('amt-remaining')[0];

        pay.innerHTML = amt.innerText;
        amtRemaining.innerHTML = '$0';
        
        const payHead = parseFloat(pay.innerText.replace(/[$,]+/g,""));
        const currentPayHead = parseFloat(amtToPayHead.innerText.replace(/[$,]+/g,""));
        const newAmtToPay = payHead + currentPayHead
        amtToPayHead.innerHTML = displayCurrency(newAmtToPay);

        const currentTotal = parseFloat(totalDue.innerText.replace(/[$,]+/g,""));
        const newRemaining = currentTotal - newAmtToPay;

        amtRemainingHead.innerHTML = displayCurrency(newRemaining);
      };
    } else {
      if(e.target.parentElement.parentElement.classList.contains('recommended')) {
        e.target.parentElement.parentElement.classList.remove('recommended');
        let pay = e.target.parentElement.parentElement.getElementsByClassName('to-pay')[0];
        let amt = e.target.parentElement.parentElement.getElementsByClassName('tot-amt')[0];
        let amtRemaining = e.target.parentElement.parentElement.getElementsByClassName('amt-remaining')[0];

        const payHead = parseFloat(pay.innerText.replace(/[$,]+/g,""));
        const currentPayHead = parseFloat(amtToPayHead.innerText.replace(/[$,]+/g,""));
        const newAmtToPay = currentPayHead - payHead
        amtToPayHead.innerHTML = displayCurrency(newAmtToPay);

        const currentTotal = parseFloat(totalDue.innerText.replace(/[$,]+/g,""));
        const newRemaining = currentTotal - newAmtToPay;

        amtRemainingHead.innerHTML = displayCurrency(newRemaining);

        pay.innerHTML = '$0';
        amtRemaining.innerHTML = amt.innerText;
      };
    };
  };

  e.preventDefault();
};