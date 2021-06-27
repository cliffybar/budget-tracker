let db;
const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_budget_item', { autoIncrement: true });
};

request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadBudgetItem() function to send all local db data to api
    if (navigator.online) {
        uploadBudgetItem();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_budget_item'], 'readwrite');
    const budgetItemObjectStore = transaction.objectStore('new_budget_item');

    // add record to the budgetItemObjectStore store with add method.
    budgetItemObjectStore.add(record);
}

function uploadBudgetItem() {
    // open a transaction on the db
    const transaction = db.transaction(['new_budget_item'], 'readwrite');

    // access the object store
    const budgetItemObjectStore = transaction.objectStore('new_budget_item');

    // get all records from store and set to a variable
    const getAll = budgetItemObjectStore.getAll();

    getAll.onsuccess = function () {
        console.log('getAll', getAll);
        // if there was data in indexedDB's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((serverResponse) => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_budget_item'], 'readwrite');
                    const budgetItemObjectStore = transaction.objectStore(
                        'new_budget_item'
                    );
                    // clear all items in the store
                    budgetItemObjectStore.clear();

                    alert('All saved transactions have been submitted');
                })
                .catch((err) => {
                    // set reference to redirect back here
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadBudgetItem);