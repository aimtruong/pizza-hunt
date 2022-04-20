
// create variable to hold db connection
let db;

// establish a connection to IndexedDB datacase and set it to version 1
const request = indexedDB.open('pizza_hunt', 1);

// this event will emit if the db version changes (nonexistant to ver 1, v1 to v2, etc)
request.onupgradeneeded = function(event){
    // save a reference to the database
    const db = event.target.result;

    // create an object store(table) called 'new_pizza', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_pizza', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function(event){
    // when db is successfully created with object store or established connection
    db = event.target.result;

    // check if app is online
    if(navigator.online){
        uploadPizza();
    }
};

request.onerror = function(event){
    // log error here
    console.log(event.target.errorCode);
};

// will be executed if no internet connection while submitting a pizza
function saveRecord(record){
    // open new transaction with db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store for 'new_pizza'
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to store
    pizzaObjectStore.add(record);
};

function uploadPizza(){
    // open transaction on db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // get all records from store
    const getAll = pizzaObjectStore.getAll();

    getAll.onsuccess = function(){
        // if data in store
        if(getAll.result.length > 0){
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message){
                        throw new Error(serverResponse);
                    }
                    
                    // open one more transaction
                    const transaction = db.transaction(['new_pizza'], 'readwrite');
                    
                    // access new_pizza object store
                    const pizzaObjectStore = transaction.objectStore('new_pizza');
                    
                    // clear all items in store
                    pizzaObjectStore.clear();
                    
                    alert('All saved pizza has been submitted');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
};

// listen for app to come back online
window.addEventListener('online', uploadPizza);