/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        console.log('Initialising...');
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');

        console.log('Here');

        // var db = window.sqlitePlugin.openDatabase({name: 'test.db', location: 'default'});
        // db.transaction(function(tr) {
        //   tr.executeSql("SELECT upper('Test string') AS upperString", [], function(tr, rs) {
        //     console.log('Got upperString result: ' + rs.rows.item(0).upperString);
        //   });
        // });

        var db = window.sqlitePlugin.openDatabase({name: 'local.db', createFromLocation: 'data/local.db'});
        console.log(db);
        db.transaction(function(tr) {
          tr.executeSql('SELECT * from Clubs'), [], function(tr, rs) {
            console.log('Results: ' + rs.rows.item(0).upperString);
          }
        });

        // window.sqlitePlugin.echoTest(function() {
        //   console.log('ECHO test OK');
        // });
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {

    }
};

app.initialize();
