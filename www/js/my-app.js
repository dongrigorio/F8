// Initialize app
var myApp = new Framework7({
    onAjaxStart: function (xhr) {
        myApp.showIndicator();
    },
    onAjaxComplete: function (xhr) {
        myApp.hideIndicator();
    }
});

console.log("go!"); 

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;
var prakticId = "";
var prakticData = [];
var piecePraktic = [];
var pieceDate = [];
var i, j = 0;
var settings ={};
var key;
var arr= [];

prakticData["prakticPieces"] = 0;
prakticData["prakticSum"] = 0;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

function alertObj(obj) {
    var str = "";
    var k;
    for (k in obj) {
        str += k + ": " + obj[k] + "\r\n";
    } 
    alert(str); 
} 

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

function getSettings(){
    //читаем переменную с настройками, и если нужно - создаем ее заново в локалсторейдже
    if (localStorage.getItem("settings") == null) { 
        settings = {email:"", pin:"", registered:"0",checkBackup:""};
        localStorage.setItem("settings", JSON.stringify(settings));
        //myApp.alert("Добро пожаловать","");
    } else {
        settings = JSON.parse(localStorage.getItem("settings"));
    }
}

//------------------Чтение бэкапа при старте----------------------------
function getBackup(){
    var noacc = "";
    
    for (var i=0; i < localStorage.length; i++) { 
    //for (key in localStorage) { // key === localStorage.key(key)
        var key = localStorage.key(i);
        
        if (key != "settings") {
            prakticData=JSON.parse(localStorage.getItem(key));
            if (settings.checkBackup == "1") {
                (function( key ) {
                    //console.log("Синхронизируемся с сервером"); 
                    var arr = prakticData.prakticPieces.split("=");

                    if (arr.length>0) {
                        var k = 0;
                        var dataKey = arr[arr.length-1].indexOf(":",0); //определили позицию разделителя
                        var lastDate = arr[arr.length-1].substring(dataKey+1,arr[arr.length-1].length); //выделили дату-время
                        //console.log("lastDate=" + lastDate + "\n");
                    }

                    var webUri = "https://geo-format.ru/mp.html";
                    var request = "a="  + encodeURIComponent(settings.email)
                                + "&pin=" + encodeURIComponent(settings.pin)            
                                + "&oper=" + encodeURIComponent("7") 
                                + "&id=" + encodeURIComponent(key)
                                + "&time=" + encodeURIComponent(+lastDate ) 
                                + "&rnd=" + encodeURIComponent( Math.random() );

                    // open WEB      
                    var x = new XMLHttpRequest();
                    x.open("POST", webUri, true);
                    x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    x.send(request);
                    x.onload = function (){
                        //console.log(x.responseText);
                        var resp1 = x.responseText.indexOf("<response>",0);
                        var resp2 = x.responseText.indexOf("</response>",resp1+1);

                        var resp3 = x.responseText.substr(resp1+10,resp2-resp1-10).split("&")
                        //console.log(resp3);
                        if( (resp3[0] == "oper=7") && (resp3[1] == "a=" + settings.email) && (resp3[2] == "status=datanosync") ) {
                            //console.log("Данные об изменении практики на сервере более старые, чем в локальной базе"); 
                        } 
                         if( (resp3[0] == "oper=7") && (resp3[1] == "a=" + settings.email) && (resp3[2] == "status=datanosynceq") ) {
                            //console.log("Данные об изменении практики на сервере АКТУАЛЬНЫ не отличаются от локальной базы"); 
                        } 
                         if( (resp3[0] == "oper=7") && (resp3[1] == "a=" + settings.email) && (resp3[2] == "status=noaccount") ) {
                            noacc = "noacc"; 
                        }                        

                        if( (resp3[0] == "oper=7") && (resp3[1] == "a=" + settings.email) && (resp3[2] == "id=" + key) && (resp3[4] == "status=datasync")  ) {
                            //console.log("Данные об изменении практики на сервере БОЛЕЕ СВЕЖИЕ, и отличаются от локальной базы"); 
                            var qq = JSON.parse(b64_to_utf8(resp3[3].substr(5)));                        
                            prakticData.prakticPieces = qq.prakticPieces;
                            prakticData.prakticSum = qq.prakticSum;
                            localStorage.setItem(key, JSON.stringify(prakticData));
                            myApp.alert("Cинхронизация с сервером выполнена успешно!","Backup", function(){
                                mainView.router.reloadPage('index.html'); 
                            });
                        } 
                    }
                })( key );
            }
            if (noacc == "noacc") {
                settings.registered = "0";
                myApp.alert("Аккаунт" + settings.email + " не найден на сервере резервирования. Проверьте настройки!","Backup");
            }
        }
    }
    //------------------бэкап при старте---------------------------- 
    
}

myApp.onPageInit('*', function (page) {     
    //console.log(page.name + ' initialized'); 
    console.log("--->" + myApp.getCurrentView().activePage.name);
});

function onBackKeyDown() {
    switch (myApp.getCurrentView().activePage.name) {
        case "index":               
            myApp.confirm("Закрыть программу?","Моя Практика", function () {
                    navigator.app.exitApp();
                },function () {
                    //mainView.router.load({url:'index.html'});
                    mainView.router.reloadPage('index.html');    
            });    

            break;
                                    
        case "editPraktic":         
            mainView.router.back({
                pageName: "praktic"
            });
            pageInitPraktic.trigger();
            break;
            
        default:
            mainView.router.load({url:'index.html'});       
            break;
    }  
}

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function () {
    document.addEventListener("backbutton", onBackKeyDown, false);
    console.log("Device is ready!");
    getSettings();
    getBackup();
    mainView.router.reloadPage('index.html');     //эквивалент  = mainView.router.refreshPage();

});

var indexPage = myApp.onPageInit('index', function (page) {
    var prakticCount = 0;
    //myApp.alert("localStorage.length=" + localStorage.length);
    
    //формируем первую страницу
    for (var key=0; key < localStorage.length; key++) { 

        //читаем данные из хранилища чтобы показать на 1 странице
        // на каждую практику в локалсторадже заводится ОДНА строка
        if ((localStorage.key(key) != "settings") ){

            prakticCount++;
            
            prakticData = JSON.parse(localStorage.getItem(localStorage.key(key)));   
            
            var cBlock = document.createElement("div");
            cBlock.className = "content-block";  

            var cBlock1 = document.createElement("div");
            cBlock1.className = "card semilayer";

            var cBlock2 = document.createElement("div");
            cBlock2.className = "card-header";
            cBlock2.innerHTML = "<b>" + prakticData.prakticName + "</b>";

            var cBlock3 = document.createElement("div");
            cBlock3.className = "card-content";

            var cBlock4 = document.createElement("div");
            cBlock4.className = "card-content-inner";

            cBlock4.innerHTML = "<p>Цель = <b>" + prakticData.prakticLength + "</b></p>"
                + "<p>Выполнено = <b>" + prakticData.prakticSum + "</b></p>"
                + "<p><a href=\"praktic.html\" class=\"button button-big go-praktic\" id=\"go-praktic\" type=\""
                + localStorage.key(key)
                + "\">Go!</a></p>";

            var cBlock5 = document.createElement("div");
            cBlock5.className = "ct-chart ct-double-octave";
            cBlock5.innerHTML = "<style type=\"text/css\">"
                +   ".ct-series-a .ct-bar, .ct-series-a .ct-line, .ct-series-a .ct-point, .ct-series-a .ct-slice-donut {stroke: #39E639;}"
                +   ".ct-series-b .ct-bar, .ct-series-b .ct-line, .ct-series-b .ct-point, .ct-series-b .ct-slice-donut {stroke: #FF4040;}"
                +   "</style>";

            //сделано в %
            var piecesDone = +prakticData.prakticSum/+prakticData.prakticLength * 100 ^ 0;

            if (piecesDone >100) {
                piecesDone = 100;
            }
            // осталось в %
            (+piecesDone >0) ? (piecesDo = 100 - +piecesDone):( piecesDo = 100);

            new Chartist.Bar(cBlock5, {
              labels: ['', ''],
              series: [ [+piecesDone], [+piecesDo]]
            }, {
              stackBars: true,
              horizontalBars: true,
              chartPadding: 15,
                seriesBarDistance: 100,
                axisY: {
                    offset:10,
                    padding: 100,
                    position: 200
                },
                axisY: {
                    offset:10,
                    padding: 100,
                    position: 200
                }
            });

            cBlock4.appendChild(cBlock5); 
            cBlock3.appendChild(cBlock4);    
            cBlock1.appendChild(cBlock2);
            cBlock1.appendChild(cBlock3);
            cBlock.appendChild(cBlock1);       

            document.getElementById("page-content").appendChild(cBlock);  
        }
    }
    
    // если практик нет ни одной- показываем текст
    if (prakticCount == 0) {
            var cBlock = document.createElement("div");
            cBlock.className = "content-block";  

            var cBlock1 = document.createElement("div");
            cBlock1.className = "card semilayer";

            var cBlock2 = document.createElement("div");
            cBlock2.className = "card-header";
            cBlock2.innerHTML = "Добро пожаловать!";

            var cBlock3 = document.createElement("div");
            cBlock3.className = "card-content";

            var cBlock4 = document.createElement("div");
            cBlock4.className = "card-content-inner";

            cBlock4.innerHTML = "<p>Обратите внимание на значок меню <i class=\"icon icon-bars\"></i> в правом верхнем углу экрана. В открывшемся меню вы сможете добавить и настроить свои практики, а так же зарегистрироваться на сервере программы для резервного копирования данных с вашего устройства.</p>";

            cBlock3.appendChild(cBlock4);    
            cBlock1.appendChild(cBlock2);
            cBlock1.appendChild(cBlock3);
            cBlock.appendChild(cBlock1);       

            document.getElementById("page-content").appendChild(cBlock);  
    }
    
    //в параметре type лежит ключ к данным в ЛокалСторейдже
    $$('.go-praktic').on('click', function () {        
        prakticId = event.target.type;
    });        
    
});


myApp.onPageInit('addPraktic', function (page) {
    
   //практикИд = текущее время
    prakticId = +new Date();
                                                                                        
    $$('.save-data-addPraktic').on('click', function () {
        
        var formData = myApp.formToJSON('#addPraktic');
        
        if ( formData["prakticName"] > "" 
            && formData["prakticLength"] > ""
            && formData["prakticCircleLength"] >"") {
            
                formData["prakticSum"] = "";
                formData["prakticPieces"] = ""; 
                localStorage.setItem(prakticId, JSON.stringify(formData));
                myApp.alert('Добавлена практика "' + formData["prakticName"] + '"' ,"", 
                            function(){
                                mainView.router.loadPage('index.html');  
                            }   
                );
            }
    });
   
});



var backupPage = myApp.onPageInit('backup', function (page) {

    var resp1, resp2;
    var resp3 = [];    

    //есть регистрация
    if (settings.registered == "3"){
        
            document.getElementById("registered-0").hidden = true;  
            document.getElementById("registered-1").hidden = true;  
            document.getElementById("account").innerHTML = "<i>" + settings.email + "</i>";  

            if (settings.checkBackup == "1") {
                document.getElementById("checkBackup").checked = true;
            }
            document.getElementById("backup-1").hidden = false; 
            //console.log("settings.registered= " +settings.registered);
    }
    
    //регистрация пошла, запрашиваем пинкод
    if (settings.registered == "1"){
            document.getElementById("registered-0").hidden = true;  
                        
            document.registeredForm1.pin.value = "";
            document.registeredForm1.mailTo.value = settings.email;
        
            document.getElementById("registered-1").hidden = false;  
            
            //console.log("settings.registered= " +settings.registered);
    }
    
    //нет регистрации. запрашиваем имейл
    if (settings.registered == "0"){
            document.getElementById("registered-0").hidden = false;  
            
            //console.log("settings.registered= " +settings.registered);
    }

    $$('.registered-0').on('click', function () {

        //settings.registered = "1";
        //backupPage.trigger();
        
        var backupForm = myApp.formToJSON('#registered-0');
        
        if (backupForm["mailTo"] > "") {
            settings.email =  backupForm["mailTo"];
            localStorage.setItem("settings", JSON.stringify(settings));
            
            var webUri = "https://geo-format.ru/mp.html";
            var request = "a="  + encodeURIComponent(backupForm["mailTo"]) 
                        + "&oper=" + encodeURIComponent(settings.registered) 
                        + "&rnd=" + encodeURIComponent(Math.random());
            
            //console.log("webUri= " + webUri);
            //console.log("request= " + request);
            
            // open WEB      
            var x = new XMLHttpRequest();
            x.open("POST", webUri, true);
            x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            x.send(request);
            x.onload = function (){
                //console.log(x.responseText);
                resp1 = x.responseText.indexOf("<response>",0);
                resp2 = x.responseText.indexOf("</response>",resp1+1);
                
                resp3 = x.responseText.substr(resp1+10,resp2-resp1-10).split("&")
                //console.log("resp3-0=" + resp3[0]);
                //console.log("resp3-1=" + resp3[1]);
                //console.log("resp3-2=" + resp3[2]);
                
                if( (resp3[0] == "oper=0") && (resp3[1] == "a=" + settings.email) ) {
                    if ((resp3[2] == "status=msgsend") ) {
                        settings.registered = "1"; //открываем экран подтверждения ПИН
                        localStorage.setItem("settings", JSON.stringify(settings));
                        //console.log("Переход к экрану подтверждения ПИН"); 
                        //backupPage.trigger();  
                        mainView.router.refreshPage();
                    };
                    if ((resp3[2] == "status=emailexist") ) {
                        myApp.alert("Email уже зарегистрирован!","Backup");
                        settings.registered = "1"; //открываем экран подтверждения ПИН
                        localStorage.setItem("settings", JSON.stringify(settings));
                        //console.log("email существует в базе, письмо не отправлено"); 
                        mainView.router.refreshPage();
                    };   
                    if ((resp3[3] == "status=msgnosend") ) {
                        myApp.alert("Ошибка почтовой службы: " + resp3[2],"Backup");
                    }
                } 
            }
        }
      
    });
    
    $$('.registered-1').on('click', function () {

        var backupForm = myApp.formToJSON('#registeredForm1');
        
        if ((backupForm["mailTo"] > "") && (backupForm["pin"] > "")){
            settings.email = backupForm["mailTo"];
            var webUri = "https://geo-format.ru/mp.html";
            var request = "a="  + encodeURIComponent(backupForm["mailTo"]) 
                        + "&oper=" + encodeURIComponent(settings.registered) 
                        + "&pin=" + encodeURIComponent(backupForm["pin"])
                        + "&rnd=" + encodeURIComponent(Math.random());

            //console.log("webUri= " + webUri);
            //console.log("request= " + request);
            
            // open WEB      
            var x = new XMLHttpRequest();
            x.open("POST", webUri, true);
            x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            x.send(request);
            x.onload = function (){
                //console.log(x.responseText);
                var resp1 = x.responseText.indexOf("<response>",0);
                var resp2 = x.responseText.indexOf("</response>",resp1+1);
                
                var resp3 = x.responseText.substr(resp1+10,resp2-resp1-10).split("&")
                //console.log(resp3);

                if( (resp3[0] == "oper=1") && (resp3[1] == "a=" + settings.email) && (resp3[2] == "status=regok") ) {
                    settings.registered = "3"; 
                    settings.pin = backupForm["pin"];
                    localStorage.setItem("settings", JSON.stringify(settings));
                    mainView.router.refreshPage();
                    myApp.alert("Вы зарегистрированы!","Backup");
                    //console.log("Переход к экрану активации бэкапа"); 
                } else {
                                        
                    //console.log("Ответ сервера не верен, переход к экрану повтроного ввода ПИН");
                    
                    myApp.confirm("Ошибка при регистрации! Повторить ввод пин-кода?","Backup", function () {
                        settings.registered = "1";
                        localStorage.setItem("settings", JSON.stringify(settings));
                        resp3 = [];
                        document.registeredForm1.pin.value = "";
                        document.registeredForm1.mailTo.value = settings.email;
                    },function () {
                        location.href="index.html";
                    });
                }                
            }
        }
    });
    
 
    $$('.registered-0-1').on('click', function () {
        settings.registered = "1"; 
        //settings.pin = ""; 
        localStorage.setItem("settings", JSON.stringify(settings));
        mainView.router.refreshPage();
    });    
    
    $$('.registered-1-back').on('click', function () {
        settings.registered = "0";
        //settings.pin = "";
        localStorage.setItem("settings", JSON.stringify(settings));
        mainView.router.refreshPage();
    });
    
    $$('.backup-1-ok').on('click', function () {
        if (settings.registered == "3") {
            (document.backupForm1.checkBackup.checked )?  (settings.checkBackup="1") : (settings.checkBackup="0");
            localStorage.setItem("settings", JSON.stringify(settings));

            //console.log("checkBackup = " + settings.checkBackup); 
        }
    });

    $$('.backup-2-ok').on('click', function () {
        
         myApp.confirm("Изменить аккаунт?","Backup", function () {
            settings.registered = "0";
            localStorage.setItem("settings", JSON.stringify(settings));
            resp3 = [];
            document.registeredForm1.pin.value = "";
            document.registeredForm1.mailTo.value = settings.email;
            mainView.router.refreshPage();
        },function () {
            mainView.router.refreshPage();
        });       
    });

    $$('.backup-3-getsrv').on('click', function () {
        
         myApp.confirm("Загрузить данные о практиках с сервера?","Backup", function () {
 
            var webUri = "https://geo-format.ru/mp.html";
            var request = "a="  + encodeURIComponent(settings.email) 
                        + "&oper=" + encodeURIComponent("10") 
                        + "&pin=" + encodeURIComponent(settings.pin)
                        + "&rnd=" + encodeURIComponent(Math.random());
            
            //console.log("webUri= " + webUri);
            //console.log("request= " + request);
            
            // open WEB      
            var x = new XMLHttpRequest();
            x.open("POST", webUri, true);
            x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            x.send(request);
            x.onload = function (){
                //console.log(x.responseText);
                var resp1 = x.responseText.indexOf("<response>",0);
                var resp2 = x.responseText.indexOf("</response>",resp1+1);
                
                var resp3 = x.responseText.substr(resp1+10,resp2-resp1-10).split("&")
                //console.log(resp3);
                
                var qaz = JSON.parse(resp3[2].substr(5));
                
                var data, key, wsx, k = [];
                
                if( (resp3[0] == "oper=10") && (resp3[1] == "a=" + settings.email) && (resp3[3] == "status=alldata") ) {
                    
                    for (var i=0; i < localStorage.length; i++) { 
                        var k = localStorage.key(i);
                        if (k != "settings")
                            localStorage.removeItem(k);                        
                    }
                    
                    for (k in qaz){
                        wsx = JSON.parse(qaz[k]);
                        key = wsx["id"];
                        //console.log(key);
                        data = b64_to_utf8(wsx["data"]);
                        //console.log(data);
                        localStorage.setItem(key, data);
                    }
                    myApp.alert("Данные с сервера загружены","Backup", function(){
                        mainView.router.loadPage('index.html');
                    });
                } else {
                    myApp.alert("Ошибка получения данных","Backup");                   
                }
            }  
        },function () {
            mainView.router.refreshPage();
        });       
    });    

});

var pageInitPraktic = myApp.onPageInit('praktic', function (page) {
    //console.log("prakticId = " + prakticId);
    var prakticData = JSON.parse(localStorage[prakticId]);
    var date = new Date();
    var my_div;
    var sumSession = 0;
    var formData;
    var prevInput = 0;
    
    var optionsDate = {
       year: '2-digit',
      month: 'short',
        day: '2-digit'
    };
    piecePraktic=[]; 
    pieceDate=[];
    
    document.getElementById("prakticName").innerHTML = prakticData["prakticName"];
    document.getElementById("praktic-result").innerHTML = (prakticData["prakticSum"] == "") ? "0" : +prakticData["prakticSum"];
    document.getElementById("praktic-up").innerHTML = +prakticData["prakticLength"] - +prakticData["prakticSum"];

    if (prakticData.prakticPieces.length > 0){
        
        var arr = prakticData.prakticPieces.split("=");
        var labels1 = [], series1 = [];
        var k = 0;

        for (i=0; i<arr.length; i++){
            var dataKey = arr[i].indexOf(":",0); //определили позицию разделителя
                piecePraktic[i] = arr[i].substring(0,dataKey); //выделили кол-во повторений
                pieceDate[i] = arr[i].substring(dataKey+1,arr[i].length); //выделили дату-время
                date.setTime(pieceDate[i]);
                labels1[i] = date.toLocaleString('en-GB', optionsDate); //'en-GB'
                series1[i] = +piecePraktic[i];
                k += +piecePraktic[i];
        }
        
        //не будем показывать
        /*
        var str = "<table border=0 cellpadding = 5>";
        str += "<tr valign = middle><td> <b>" + prakticData["prakticCircleLength"] + "</b></td><td> длина одного круга</td></tr>";
        str += "<tr valign = middle><td> <b>" + ((+k/(arr.length-1))^0) + "</b></td><td> cреднее количеcтво повторений за одну сессию </td></tr>";
        str += "<tr valign = middle><td> <b>" + ( (+prakticData.prakticLength - +prakticData.prakticSum)/(+k/(arr.length-1))^0  ) + "</b></td><td> сессий потребуется для достижения цели</td></tr>"; 
        str += "</table>";
        */
        
    
        date.setTime(+pieceDate[arr.length-1]- +pieceDate[0] + 5*1000*60*60*24);
        var periodDate = (date/ 24 / 60 / 60 / 1000 )^0;
        
    
        new Chartist.Bar('.ct-chart-day', {
          labels: labels1,
          series: [series1]
        }, {
            horizontalBars: true,
            axisY: {
               offset: 70
            }
        });
        
        //не будем показывать
        //document.getElementById("circle-length").innerHTML = str;

        mainView.router.refreshPage();        

    } else {
        document.getElementById("ct-chart-day").innerHTML = "Добавьте первую сессию, и статистика начнет считаться.";
    } 

    document.getElementById("cirleShow").innerHTML = "Добавить круги (" + prakticData["prakticCircleLength"] + "):";
    
    
    $$('.dpp').on('keyup', function () { //keyup keydown change dataPrakticPieces
        //console.log("vent.keyCode= " + event.keyCode);
    
        formData = myApp.formToJSON('#dataPraktic'); 
        
        var resInput = +formData['dpp'];
        sumSession = +sumSession - +prevInput + +resInput;

        if (sumSession<=0) sumSession = 0;
        prevInput = resInput;
        document.getElementById("session-result").innerHTML = +sumSession;            
    });   
    
    $$('.inc-result').on('click', function () {
        sumSession += +prakticData["prakticCircleLength"];
        document.getElementById("session-result").innerHTML = sumSession;  
    });
    
    $$('.dec-result').on('click', function () {
        if (sumSession >= +prakticData["prakticCircleLength"]) {
            sumSession -= +prakticData["prakticCircleLength"];
        }
        document.getElementById("session-result").innerHTML = sumSession;  
    });    
        
    $$('.save-data-praktic').on('click', function () {

        if (sumSession>0) {
                                
            prakticData.prakticSum = +prakticData.prakticSum + +sumSession;
            //сохраняем последние 20 значений
            //если записано больше 19 значений то запишем все кроме первого, если меньше то все
            
            (piecePraktic.length >19) ? (j=1):(j=0);  
            
            prakticData.prakticPieces = "";
            
            for (j; j<piecePraktic.length; j++) {
                prakticData.prakticPieces += piecePraktic[j]
                + ":"
                + pieceDate[j]
                + "=";       
            }
            
            //записываем последнее введенное значение
            var dateLastPiece = +new Date().valueOf(); 
            prakticData.prakticPieces += sumSession + ":" + +dateLastPiece;

            localStorage.setItem(prakticId, JSON.stringify(prakticData));

            if ( (settings.checkBackup =="1") && (settings.registered == "3") ) {

                var webUri = "https://geo-format.ru/mp.html";
                var request = "a="  + encodeURIComponent(settings.email)
                            + "&pin=" + encodeURIComponent(settings.pin)            
                            + "&oper=" + encodeURIComponent("22") 
                            + "&id=" + encodeURIComponent(prakticId)
                            + "&data=" + utf8_to_b64(JSON.stringify(prakticData))
                            + "&time=" + encodeURIComponent(+dateLastPiece ) 
                            + "&rnd=" + encodeURIComponent( Math.random() );

                //console.log("webUri= " + webUri);
                //console.log("request= " + request);

                // open WEB      
                var x = new XMLHttpRequest();
                x.open("POST", webUri, true);
                x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                x.send(request);
                x.onload = function (){
                    //console.log(x.responseText);
                    var resp1 = x.responseText.indexOf("<response>",0);
                    var resp2 = x.responseText.indexOf("</response>",resp1+1);

                    var resp3 = x.responseText.substr(resp1+10,resp2-resp1-10).split("&")
                    //console.log(resp3);

                    if( (resp3[0] == "oper=22") && (resp3[1] == "a=" + settings.email) && (resp3[2] == "status=datanosaved") ) {
                        myApp.alert("Изменения не сохранены на сервере. Обновите настройки вашего аккаунта " + settings.email,"Backup");
                        //console.log("Данные об изменении практики не сохранились на сервере"); 
                    } 
                }
            }
            mainView.router.refreshPage();
        }
    });

    
    $$('.edit-data').on('click', function () {
        myApp.closeModal();
    });   

    
    $$('.delete-last-data').on('click', function () {
            myApp.closeModal();
            if (piecePraktic.length > 0) {
                myApp.confirm("Последняя сессия "+ +piecePraktic[piecePraktic.length-1] + " повторений. Удалить ?","", function () {

                    prakticData.prakticSum = +prakticData.prakticSum - +piecePraktic[piecePraktic.length-1];

                    //console.log("1:  piecePraktic.length =" + piecePraktic.length); 

                    piecePraktic.splice(piecePraktic.length-1, 1);
                    pieceDate.splice(pieceDate.length-1, 1);  

                    //console.log("2:  DEL piecePraktic.length =" + piecePraktic.length); 

                    prakticData.prakticPieces = "";

                    if ((piecePraktic.length)>0){
                        for (j=0; j<piecePraktic.length; j++) {
                            prakticData.prakticPieces += piecePraktic[j]
                            + ":"
                            + pieceDate[j]
                            + "=";       
                        }
                    }
                    //отрезаем последнее равно
                    prakticData.prakticPieces = prakticData.prakticPieces.substring(0,  prakticData.prakticPieces.length-1);
                    //console.log("prakticData.prakticPieces =" + prakticData.prakticPieces);
                    
                    //--------------------------------------
                    localStorage.setItem(prakticId, JSON.stringify(prakticData));
                    //myApp.alert("Последняя сессия удалена", "");
                    if ( (settings.checkBackup =="1") && (settings.registered == "3") ) {

                        var webUri = "https://geo-format.ru/mp.html";
                        var request = "a="  + encodeURIComponent(settings.email)
                                    + "&pin=" + encodeURIComponent(settings.pin)            
                                    + "&oper=" + encodeURIComponent("22") 
                                    + "&id=" + encodeURIComponent(prakticId)
                                    + "&data=" + utf8_to_b64(JSON.stringify(prakticData))
                                    + "&time=" + encodeURIComponent(+pieceDate[pieceDate.length-1] ) 
                                    + "&rnd=" + encodeURIComponent( Math.random() );

                        //console.log("webUri= " + webUri);
                        //console.log("request= " + request);

                        // open WEB      
                        var x = new XMLHttpRequest();
                        x.open("POST", webUri, true);
                        x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        x.send(request);
                        x.onload = function (){
                            //console.log(x.responseText);
                            var resp1 = x.responseText.indexOf("<response>",0);
                            var resp2 = x.responseText.indexOf("</response>",resp1+1);

                            var resp3 = x.responseText.substr(resp1+10,resp2-resp1-10).split("&")
                            //console.log(resp3);

                            if( (resp3[0] == "oper=22") && (resp3[1] == "a=" + settings.email) && (resp3[2] == "status=datanosaved") ) {
                                myApp.alert("Изменения не сохраены на сервере. Проверьте ваш аккаунт " + settings.email,"Backup");
                                //console.log("Данные об изменении практики не сохранились на сервере"); 
                            } 
                        }
                    }
                    //---------------------------------------
                    mainView.router.refreshPage();
                });
        } else {
            myApp.alert("Нет данных для удаления", "");
            mainView.router.refreshPage();   
        }     
    }); 
});


myApp.onPageInit('editPraktic', function (page) {
    
    var prakticData=JSON.parse(localStorage.getItem(prakticId));

    document.editPraktic.prakticName.value = prakticData["prakticName"];
    document.editPraktic.prakticLength.value = prakticData["prakticLength"];
    document.editPraktic.prakticCircleLength.value = prakticData["prakticCircleLength"];
    
    $$('.cancel-data').on('click', function () {
        mainView.router.back({
            pageName: "praktic"
        }); 
    });

    $$('.save-data-editPraktic').on('click', function () {
        prakticData["prakticName"] = document.editPraktic.prakticName.value;
        prakticData["prakticLength"] = document.editPraktic.prakticLength.value;
        prakticData["prakticCircleLength"] = document.editPraktic.prakticCircleLength.value;

        localStorage.setItem(prakticId, JSON.stringify(prakticData));

        //myApp.alert("Данные сохранены", "editPraktic");

        mainView.router.back({
            pageName: "praktic"
        });
        pageInitPraktic.trigger();
    });
    
    $$('.delete-praktic').on('click', function () {
             myApp.confirm("Удалить практику " + prakticData["prakticName"] + "?","", function () {
                localStorage.removeItem(prakticId);
                var webUri = "https://geo-format.ru/mp.html";
                var request = "a="  + encodeURIComponent(settings.email)
                            + "&pin=" + encodeURIComponent(settings.pin)            
                            + "&oper=" + encodeURIComponent("del") 
                            + "&id=" + encodeURIComponent(prakticId)
                            + "&rnd=" + encodeURIComponent( Math.random() );

                // open WEB      
                var x = new XMLHttpRequest();
                x.open("POST", webUri, true);
                x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                x.send(request);
                x.onload = function (){
                    var resp1 = x.responseText.indexOf("<response>",0);
                    var resp2 = x.responseText.indexOf("</response>",resp1+1);
                    var resp3 = x.responseText.substr(resp1+10,resp2-resp1-10).split("&");

                    if( (resp3[0] == "oper=del") && (resp3[1] == "a=" + settings.email) && (resp3[2] == "status=prakticDeleted") ) {
                        myApp.alert("Практика удалена!" ,"Backup");
                    } 
                }                 
                mainView.router.loadPage('index.html');
                 //location.href="index.html";
            });
    });
   
});