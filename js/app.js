init();
domo.get(`/domo/datastores/v1/collections/ap-app-data/documents/`)
    .then(data => console.log(data));