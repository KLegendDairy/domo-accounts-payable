let table;

function loadFilters() {
    // if(table) {
    //     table.destroy();
    //     const row = $('#')
    //     // row.remove();
    //     console.log(row);
    // };
  // Setup - add a text input to each footer cell
  $('#data-table thead tr').clone(true).appendTo( '#data-table thead' );
//   console.log($('#data-table thead tr'));
  $('#data-table thead tr:eq(1) th').each( function (i) {
      var title = $(this).text();
      $(this).html( '<input type="text" placeholder="Search '+title+'" />' );

      $( 'input', this ).on( 'keyup change', function () {
          if ( table.column(i).search() !== this.value ) {
              table
                  .column(i)
                  .search( this.value )
                  .draw();
          }
      } );
  } );

  table = $('#data-table').DataTable( {
      orderCellsTop: true,
      autoWidth: true,
      lengthMenu: [[10,25,50,75,100,250,500,750,1000, -1], [10,25,50,75,100,250,500,750,1000, "All"]]
    //   fixedHeader: true
  } );
};

function destroyTable() {
    if(table) {
        table.destroy();
    };
};
