// Declare UI Variables
const summaryBtn = document.getElementById('summary-link');
const mgtBtn = document.getElementById('mgt-prop-link');
const devBtn = document.getElementById('dev-other-link');
const dataTable = document.getElementById('data-table');
const totalDue = document.getElementById('total-amt-due');
const filterBar = document.getElementById('filter');
const tableRow = dataTable.getElementsByTagName('tr');

// LOAD EVENT LISTENERS
(function loadEventListeners() {
  summaryBtn.addEventListener('click', navClicked);
  mgtBtn.addEventListener('click', navClicked);
  devBtn.addEventListener('click', navClicked);
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


// INITIAL CALL TO GET DATA
// GET DATA
function getData(domo) {
  domo.get(`/data/v1/accountsPayableData?sum=amount&groupby=company`)
    .then(data => {
      data.sort((a,b) => {
        return b.amount - a.amount
      });
      paintTable(data)
    })
    .catch(err => console.log(err));
};


// DATA TABLE ITEMS

// PAINT TABLE
function paintTable(data) {
  let totalAmt = 0;
  let htmlToAdd = `
        <thead>
          <th>Company</th>
          <th>Amount Due</th>
          <th>Recommended for Payment</th>
        </thead>`;

  data.forEach(company => {
    htmlToAdd += `
    <tr id="row-${company.company}" class="data-table-row">
      <td>${company.company}</td>
      <td>${displayCurrency(company.amount)}</td>
      <td><input type="checkbox" class="recommend-check" id="rec-${company.company}"></td>
    </tr>`;
    totalAmt += company.amount;
  });

  dataTable.innerHTML = htmlToAdd;
  totalDue.innerHTML = displayCurrency(totalAmt);
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
  removeClass('selected');
  addClass(e.target.id, 'selected');
    
  e.preventDefault();
};




function filterList(e) {
  const text = e.target.value.toLowerCase();

  for (i = 0; i < tableRow.length; i++) {
    row = tableRow[i].firstElementChild;
    if(row.nodeName === 'TD') {
      rowValue = row.textContent || row.innerText;
      if(rowValue.toLowerCase().indexOf(text) !== -1) {
        tableRow[i].style.display = '';
      } else {
        tableRow[i].style.display = 'none';
      };
    }
  };

  e.preventDefault();
};

function checkBoxCheck(e) {
  if(e.target.classList.contains('recommend-check')) {
    if(e.target.checked) {
      if(!e.target.parentElement.parentElement.classList.contains('recommended')) {
        e.target.parentElement.parentElement.classList.add('recommended')
      }
    } else {
      if(e.target.parentElement.parentElement.classList.contains('recommended')) {
        e.target.parentElement.parentElement.classList.remove('recommended')
      };
    };
  };

  e.preventDefault();
};