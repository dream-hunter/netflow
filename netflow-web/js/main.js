var devices_categories    = new Array();
devices_categories = [
    { 'id' : 0, 'name' : "Enabled devices"},
    { 'id' : 1, 'name' : "Disabled devices"}
];

var interfaces_categories = new Array();
interfaces_categories = [
    { 'id' : 0, 'name' : "Enabled interfaces"},
    { 'id' : 1, 'name' : "Disabled interfaces"}
]

var v9templates_categories = new Array();
v9templates_categories = [
    { 'id' : 0, 'name' : "Enabled templates"},
    { 'id' : 1, 'name' : "Disabled templates"}
]

var user         = new Array();
var users        = new Array();
var groups       = new Array();
var devices      = new Array();
var interfaces   = new Array();
var v9templates  = new Array();
var ipfix        = new Array();
var links        = new Array();
var current_tab  = "content-dashboard-tab";

function ContextMenu(x,y) {
    console.log("Context menu call "+x+":"+y);
}

var getJSON = function(url, callback) {
    var xmlhttprequest = new XMLHttpRequest();
    xmlhttprequest.open('GET', url, true);
    xmlhttprequest.responseType = 'json';
    xmlhttprequest.onload = function() {
        var status = xmlhttprequest.status;
        if (status == 200) {
            callback(null, xmlhttprequest.response);
        } else {
            callback(status, xmlhttprequest.response);
        }
    };
    xmlhttprequest.send();
};

var postJSON = function(url, post, callback) {
    var xmlhttprequest = new XMLHttpRequest();
    xmlhttprequest.open('POST', url, true);
    xmlhttprequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttprequest.onload = function() {
        var status = xmlhttprequest.status;
        if (status == 200) {
            callback(null, xmlhttprequest.response);
        } else {
            callback(status, xmlhttprequest.response);
        }
    };
    xmlhttprequest.send(post);
}

function hideElement(id) {
    if (document.getElementById(id)) {
        document.getElementById(id).className = "invisible";
    }
}

function setElementClass(id, class_name) {
    if (document.getElementById(id)) {
        document.getElementById(id).className = class_name;
    }
}

function hideAllTabs() {
    hideElement("dashboard-tab-label");
    hideElement("mac-data-label");
    hideElement("devices-tab-label");
    hideElement("interfaces-tab-label");
    hideElement("v9templates-tab-label");
    hideElement("raw-data-tab-label");
    hideElement("admin-tab-label");

    hideElement("content-dashboard-tab");
    hideElement("content-mac-data-tab");
    hideElement("content-devices-tab");
    hideElement("content-interfaces-tab");
    hideElement("content-v9templates-tab");
    hideElement("content-raw-data-tab");
    hideElement("content-admin-tab");

    hideElement("dashboard-toolbar");
    hideElement("mac-data-toolbar");
    hideElement("devices-toolbar");
    hideElement("interfaces-toolbar");
    hideElement("v9templates-toolbar");
    hideElement("raw-data-toolbar");
    hideElement("admin-toolbar");
}

function showAuthTabs(user) {
    setElementClass("dashboard-tab-label", "tab_label");
    setElementClass("mac-data-tab-label", "tab_label");
    if (typeof user !== 'undefined' && user !== null && user.user_enabled == 't') {
        if (user.group_reader == 't') {
            setElementClass("raw-data-tab-label", "tab_label");
        }
        if (user.group_writer == 't') {
            setElementClass("devices-tab-label", "tab_label");
            setElementClass("interfaces-tab-label", "tab_label");
            setElementClass("v9templates-tab-label", "tab_label");
            setElementClass("raw-data-tab-label", "tab_label");
        }
        if (user.group_admin == 't') {
            setElementClass("devices-tab-label", "tab_label");
            setElementClass("interfaces-tab-label", "tab_label");
            setElementClass("v9templates-tab-label", "tab_label");
            setElementClass("raw-data-tab-label", "tab_label");
            setElementClass("admin-tab-label", "tab_label");
        }
    }
}

function DelElement(elementId) {
    if (document.getElementById(elementId)) {
        document.getElementById(elementId).remove();
    }
}

function AddElement(element_tag, element_parentid, element_id, element_class, element_innerHTML, element_attributes) {
    if (document.getElementById(element_parentid)) {
        var newelement = document.createElement(element_tag);
        if (typeof element_id !== 'undefined' && element_id !== null) {
            newelement.setAttribute("id", element_id);
        }
        if (typeof element_class !== 'undefined' && element_class !== null) {
            newelement.className = element_class;
        }
        if (typeof element_innerHTML !== 'undefined' && element_innerHTML !== null) {
            newelement.innerHTML = element_innerHTML;
        }
        if (typeof element_attributes !== 'undefined' && element_attributes !== null) {
            for (var i=0;i<element_attributes.length;i++) {
                newelement.setAttribute(element_attributes[i].name,element_attributes[i].value);
            }
        }
        document.getElementById(element_parentid).appendChild(newelement);
    }
}

function SwitchTab (tab_id) {
    document.getElementById("process-screen").className = "process_splash";
    hideAllTabs();

    if (tab_id == "content-dashboard-tab") {
        getJSON('./php/auth.php?login',  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                user = data.user;
                showUserName(user);
            }
            showAuthTabs(user);
            document.getElementById("dashboard-toolbar").className = "toolbar_row";
            clearDashboardTab();
            addExternalLinks();
            document.getElementById("process-screen").className = "invisible";
            document.getElementById(tab_id).className = "visible";
            document.getElementById("dashboard-tab").checked = true;
        });
    }
    if (tab_id == "content-mac-data-tab") {
        showAuthTabs(user);
        clearMacDBTab();
        document.getElementById("process-screen").className = "invisible";
        document.getElementById(tab_id).className = "visible";
        document.getElementById("mac-data-tab").checked = true;
    }
    if (tab_id == "content-devices-tab") {
        getJSON('./php/itemlist.php?devices',  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                devices = data.devices;
                user = data.user;
                showUserName(user);
                clearDeviceTab();
                addDevicesCategories();
                AddDevices();
            }
            showAuthTabs(user);
            document.getElementById("devices-toolbar").className = "toolbar_row";
            document.getElementById("process-screen").className = "invisible";
            document.getElementById(tab_id).className = "visible";
            document.getElementById("devices-tab").checked = true;
        });
    }
    if (tab_id == "content-interfaces-tab") {
        getJSON('./php/itemlist.php?devices&interfaces',  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                devices = data.devices;
                user = data.user;
                interfaces = data.interfaces;
                showUserName(user);
                clearInterfacesTab();
            }
            showAuthTabs(user);
            document.getElementById("interfaces-toolbar").className = "toolbar_row";
            document.getElementById("process-screen").className = "invisible";
            document.getElementById(tab_id).className = "visible";
            document.getElementById("interfaces-tab").checked = true;
        });
    }
    if (tab_id == "content-v9templates-tab") {
        getJSON('./php/itemlist.php?v9templates',  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                v9templates = data.v9templates;
                user = data.user;
                showUserName(user);
                clearTemplatesTab();
                addV9TemplatesCategories();
                addV9Templates();
            }
            showAuthTabs(user);
            document.getElementById("v9templates-toolbar").className = "toolbar_row";
            document.getElementById("process-screen").className = "invisible";
            document.getElementById(tab_id).className = "visible";
            document.getElementById("v9templates-tab").checked = true;
        });
    }
    if (tab_id == "content-raw-data-tab") {
        getJSON('./php/itemlist.php?devices&interfaces&v9templates',  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                devices = data.devices;
                interfaces = data.interfaces;
                v9templates = data.v9templates;
                user = data.user;
                showUserName(user);
                clearRawDataTab();
                addRawDataDevices();
            }
            showAuthTabs(user);
            document.getElementById("raw-data-toolbar").className = "toolbar_row";
            document.getElementById("process-screen").className = "invisible";
            document.getElementById(tab_id).className = "visible";
            document.getElementById("raw-data-tab").checked = true;
        });
    }
    if (tab_id == "content-admin-tab") {
        getJSON('./php/admin.php?userlist&grouplist',  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                user = data.user;
                users = data.users;
                groups = data.groups;
                showUserName(user);
                clearAdminTab();
                addAdminTabUsers();
                addAdminTabGroups();
            }
            showAuthTabs(user);
            document.getElementById("admin-toolbar").className = "toolbar_row";
            document.getElementById("process-screen").className = "invisible";
            document.getElementById(tab_id).className = "visible";
            document.getElementById("admin-tab").checked = true;
        });
    }
    current_tab = tab_id;
}

function clearDashboardTab() {
    DelElement('tab-dashboard-table');
    AddElement("div","content_dashboard_tab","tab-dashboard-table","class_table");
    AddElement("div","tab-dashboard-table","dashboard-links","class_table_table");
    AddElement("div","dashboard-links","dashboard-links-header","class_table_row");
    AddElement("div","dashboard-links-header",null,"class_table_cell_5");
    var attributes = [ {"name": "src", "value": "img/external-link-white.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
    AddElement("img","dashboard-links-header",null,"class_table_cell_5",null,attributes);
    AddElement("div","dashboard-links-header",null,"class_table_cell","External links");
    AddElement("div","dashboard-links","dashboard-links-body","class_table_table");
}

function delExternalLinks() {
    DelElement("dashboard-links-body");
    AddElement("div","dashboard-links","dashboard-links-body","class_table_table");
}

function addExternalLinks() {
    getJSON('./php/itemlist.php?links',  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            links = data.links;
//            console.log(links);

            if (typeof links !== 'undefined' && links !== null) {
                for (var i=0;i<links.length;i++) {
                    AddElement("div","dashboard-links-body","dashboard-link"+links[i].link_id,"class_table_row");
                    if (user.group_writer == 't') {
                        var attributes = [ {"name": "type", "value": "checkbox"} ];
                        AddElement("input","dashboard-link"+links[i].link_id,"dashboard-link"+links[i].link_id+"-check","class_table_cell_5",null,attributes);
                    } else {
                        AddElement("div","dashboard-link"+links[i].link_id,null,"class_table_cell_5");
                    }
                    var attributes = [ {"name": "target", "value": "_blank"}, {"name": "rel", "value": "noopener noreferrer"}, {"name": "href", "value": links[i].link_href} ];
                    AddElement("a","dashboard-link"+links[i].link_id,null,"class_table_cell_0", links[i].link_header, attributes);
                    if (typeof links[i].link_description !== 'undefined' && links[i].link_description !== null && links[i].link_description !== '') {
                        AddElement("div","dashboard-link"+links[i].link_id,null,"class_table_cell_0", "&emsp;-&emsp;");
                        AddElement("a","dashboard-link"+links[i].link_id,null,"class_table_cell", links[i].link_description);
                    }
                }
            }
        }
    });
}

function addDashboardLink() {
    var header=document.getElementById('dialogue-input-header').value;
    var href=document.getElementById('dialogue-input-href').value;
    var description=document.getElementById('dialogue-input-description').value;
    hideElement('dialogue-stage');

    getJSON('./php/itemedit.php?add_dashboard_link&link_header='+header+'&link_href='+href+'&link_description='+description,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            user = data.user;
            showUserName(user);
        }
        showAuthTabs(user);
        delExternalLinks();
        addExternalLinks();
        document.getElementById("process-screen").className = "invisible";
    });
}

function addDashboardLinkDialogue() {
    document.getElementById("dialogue-stage").className = "dialogue_stage";
    DelElement("dialogue-body")
    AddElement("div","dialogue-window","dialogue-body","dialogue_body");

    AddElement("div","dialogue-body","dialogue-label","dialogue_label","Add link to dashboard");
    AddElement("form","dialogue-body","dialogue-form","dialogue_form");

    AddElement("div","dialogue-form","dialogue-header-row","dialogue_row");
    AddElement("div","dialogue-header-row",null,"dialogue_row_label","Header");
    var attributes = [ {"name": "type", "value": "text"} ];
    AddElement("input","dialogue-header-row","dialogue-input-header","dialogue_row_input",null,attributes);

    AddElement("div","dialogue-form",null,"dialogue_row_spacer");

    AddElement("div","dialogue-form","dialogue-href-row","dialogue_row");
    AddElement("div","dialogue-href-row",null,"dialogue_row_label","Source address");
    var attributes = [ {"name": "type", "value": "text"} ];
    AddElement("input","dialogue-href-row","dialogue-input-href","dialogue_row_input",null,attributes);

    AddElement("div","dialogue-form",null,"dialogue_row_spacer");

    AddElement("div","dialogue-form","dialogue-description-row","dialogue_row");
    AddElement("div","dialogue-description-row",null,"dialogue_row_label","description");
    var attributes = [ {"name": "type", "value": "text"} ];
    AddElement("input","dialogue-description-row","dialogue-input-description","dialogue_row_input",null,attributes);

    AddElement("div","dialogue-form",null,"dialogue_row_spacer");

    AddElement("div","dialogue-body","dialogue-bottom-line","dialogue_bottom_line");
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    var attributes = [ {"name": "onclick", "value": "addDashboardLink();"} ];
    AddElement("div","dialogue-bottom-line",null,"dialogue_button","Add",attributes);
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');"} ];
    AddElement("div","dialogue-bottom-line",null,"dialogue_button","Cancel",attributes);
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
}

function delDashboardLink() {
    hideElement('dialogue-stage');
    var link_id = new Array();
    if (typeof links !== 'undefined' && links !== null) {
        for (var i=0;i<links.length;i++) {
            if (document.getElementById("dashboard-link"+links[i].link_id+"-check").checked === true) {
                link_id.push(links[i].link_id);
            }
        }
        var query = "./php/itemedit.php?del_dashboard_link&link_id=" + link_id.join(',');
//    console.log(query);

        getJSON(query,  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                user = data.user;
                showUserName(user);
            }
            showAuthTabs(user);
            delExternalLinks();
            addExternalLinks();
            document.getElementById("process-screen").className = "invisible";
        });
    }
}

function delDashboardLinkDialogue() {
    document.getElementById("dialogue-stage").className = "dialogue_stage";
    DelElement("dialogue-body")
    AddElement("div","dialogue-window","dialogue-body","dialogue_body");

    AddElement("div","dialogue-body","dialogue-label","dialogue_label","External link delete confirmation");
    AddElement("form","dialogue-body","dialogue-form","dialogue_form");

    AddElement("div","dialogue-form","dialogue-login-row","dialogue_row");
    var attributes = [ {"name": "style", "value": "text-align:center;width:100%;"} ];
    AddElement("div","dialogue-login-row",null,"dialogue_row_label","Are you sure that you want to delete the selected links?", attributes);

    AddElement("div","dialogue-body","dialogue-bottom-line","dialogue_bottom_line");
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    var attributes = [ {"name": "onclick", "value": "delDashboardLink();"} ];
    AddElement("div","dialogue-bottom-line",null,"dialogue_button","Yes",attributes);
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');"} ];
    AddElement("div","dialogue-bottom-line",null,"dialogue_button","No",attributes);
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
}

function clearMacDBTab() {
    DelElement('tab-mac-data-table');
    AddElement("div","content_mac_data_tab","tab-mac-data-table","class_table");
    var attributes = [ {"name": "style", "value": style="height:100%;"} ];
    AddElement("div","tab-mac-data-table","tab-mac-data-columns","class_table_row",null,attributes);

    AddElement("div","tab-mac-data-columns","table-mac-data-input","class_table_col_25");
    var attributes = [ {"name": "style", "value": style="text-align:center;margin-left:auto;margin-right:auto;width:95%;"}, { "name": "onclick", "value": "resolveMACDB();"} ];
    AddElement("div","table-mac-data-input","table-mac-data-input-btn","dialogue_button","Resolve",attributes);
    var attributes = [ {"name": "style", "value": style="text-align:center;height:50%;resize:none;margin-left:auto;margin-right:auto;width:calc(95% + 4px);"} ];
    AddElement("textarea","table-mac-data-input","table-mac-data-input-text","class_table_row",null,attributes);

    AddElement("div","tab-mac-data-columns","table-mac-data-spacer","class_table_col_25");

    AddElement("div","tab-mac-data-columns","table-mac-data-output","class_table_col_50");
    AddElement("div","table-mac-data-output","table-mac-data-header","class_table_row");
    AddElement("div","table-mac-data-header",null,"class_table_cell_25","MAC address");
    AddElement("div","table-mac-data-header",null,"class_table_cell","Vendor name");

    AddElement("div","table-mac-data-output","table-mac-data-table","class_table");
}

function resolveMACDB() {
    document.getElementById("process-screen").className = "process_splash";

    getJSON('./php/macdb/macdb.php',  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            var macDB = data;
            DelElement("table-mac-data-table");
            AddElement("div","table-mac-data-output","table-mac-data-table","class_table");
            showMACDB(macDB);
        }
        document.getElementById("process-screen").className = "invisible";
    });
}

function showMACDB(macDB) {
    var stringList = new Array();
    var stringArr = new Array();
    var macList = document.getElementById("table-mac-data-input-text").value;
    stringList = macList.split("\n");

    for (var i=0;i<stringList.length;i++) {
        if (stringList[i] !== "") {
            stringArr = stringList[i].split(":");
            stringList[i] = stringArr.join("");
            stringArr = stringList[i].split("-");
            stringList[i] = stringArr.join("");
            stringArr = stringList[i].split(".");
            stringList[i] = stringArr.join("");
            stringArr = stringList[i].split(" ");
            stringList[i] = stringArr.join("");

            AddElement("div","table-mac-data-table","table-mac-data-table-row-"+i,"class_table_row");
            AddElement("div","table-mac-data-table-row-"+i,null,"class_table_cell_25",stringList[i]);

            stringList[i] = stringList[i].slice(0,6);
            stringList[i] = stringList[i].toUpperCase();


            if (typeof macDB.MAL[stringList[i]] !== 'undefined' && macDB.MAL[stringList[i]] !== null) {
                AddElement("div","table-mac-data-table-row-"+i,null,"class_table_cell_25",macDB.MAL[stringList[i]].vendor_name);
            } else {
                AddElement("div","table-mac-data-table-row-"+i,null,"class_table_cell_25","UNKNOWN");
            }
        }
    }
}

function clearDeviceTab() {
    DelElement('tab-device-table');
    AddElement("div","content_device_tab","tab-device-table","class_table");
    AddElement("div","tab-device-table","table-device-header","class_table_row");
    AddElement("div","table-device-header","header-device-check","class_table_cell_5");
    AddElement("div","table-device-header","header-device-icon","class_table_cell_5","Ico");
    AddElement("div","table-device-header","header-device-id","class_table_cell_10","Id");
    AddElement("div","table-device-header","header-device-devicename","class_table_cell_15","IP addr");
    AddElement("div","table-device-header","header-device-description","class_table_cell","Description");
    AddElement("div","table-device-header","header-device-snmpv2str","class_table_cell_10","snmp v2 str");
    AddElement("div","table-device-header","header-device-enabled","class_table_cell_10","Enabled");
}

function addDevicesCategories() {
    for (var i=0;i<devices_categories.length;i++) {
        if (typeof devices_categories[i] !== 'undefined') {
            AddElement("div","tab-device-table","device-category-row-"+i,"class_table");
            AddElement("div","device-category-row-"+i,"device-category-row-header-"+i,"class_table_row",devices_categories[i].name);
            AddElement("div","device-category-row-"+i,"device-category-row-body-"+i,"class_table");
        }
    }
}

function AddDevices() {
    if (typeof devices !== 'undefined' && devices.length > 0) {
        for (var i=0;i<devices.length;i++) {
            if (typeof devices[i] !== 'undefined') {
                if (devices[i].device_enabled == "t") {
                    AddElement("div","device-category-row-body-0","device-row-"+devices[i].device_id,"class_table_row");
                } else {
                    AddElement("div","device-category-row-body-1","device-row-"+devices[i].device_id,"class_table_row");
                }
                var attributes = [ {"name": "type", "value": "checkbox"} ];
                AddElement("input","device-row-"+devices[i].device_id,"device-"+devices[i].device_id+"-check","class_table_cell_5",null,attributes);
                AddElement("div","device-row-"+devices[i].device_id,"device-"+devices[i].device_id+"-icon","class_table_cell_5");
                if (devices[i].device_enabled == "t") {
                    var attributes = [ {"name": "src", "value": "img/lime-router-256.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                    AddElement("img","device-"+devices[i].device_id+"-icon",null,"class_table_cell",null,attributes);
                } else {
                    var attributes = [ {"name": "src", "value": "img/yellow-router-256.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                    AddElement("img","device-"+devices[i].device_id+"-icon",null,"class_table_cell",null,attributes);
                }
                AddElement("div","device-row-"+devices[i].device_id,"device-"+devices[i].device_id+"-id","class_table_cell_10",devices[i].device_id);
                AddElement("div","device-row-"+devices[i].device_id,"device-"+devices[i].device_id+"-devicename","class_table_cell_15",intToIP(devices[i].device_header));
                AddElement("div","device-row-"+devices[i].device_id,"device-"+devices[i].device_id+"-description","class_table_cell",devices[i].device_description);
                AddElement("div","device-row-"+devices[i].device_id,"device-"+devices[i].device_id+"-snmpv2str","class_table_cell_10",devices[i].device_snmpstr);
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","device-row-"+devices[i].device_id,"device-"+devices[i].device_id+"-enabled","class_table_cell_10",null,attributes);
                if (devices[i].device_enabled == "t") {
                    document.getElementById("device-"+devices[i].device_id+"-enabled").checked = true;
                }
            }
        }
    }
}

function addDeviceDialogue() {
}

function delDeviceDialogue() {
}

function selectAllDevices() {
    for (var i=0;i<devices.length;i++) {
        document.getElementById("device-"+devices[i].device_id+"-check").checked = true;
    }
}

function unselectAllDevices() {
    for (var i=0;i<devices.length;i++) {
        document.getElementById("device-"+devices[i].device_id+"-check").checked = false;
    }
}

function enableSelectedDevices() {
    document.getElementById("process-screen").className = "process_splash";
    var dev_id = new Array();
    for (var i=0;i<devices.length;i++) {
        if (document.getElementById("device-"+devices[i].device_id+"-check").checked === true) {
            dev_id.push(devices[i].device_id);
        }
    }
    var query = "./php/itemedit.php?device_enable&device_id=" + dev_id.join(',');
    console.log(query);

    getJSON(query,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            SwitchTab("content-devices-tab");
        }
    });

}

function disableSelectedDevices() {
    document.getElementById("process-screen").className = "process_splash";
    var dev_id = new Array();
    for (var i=0;i<devices.length;i++) {
        if (document.getElementById("device-"+devices[i].device_id+"-check").checked === true) {
            dev_id.push(devices[i].device_id);
        }
    }
    var query = "./php/itemedit.php?device_disable&device_id=" + dev_id.join(',');
    console.log(query);

    getJSON(query,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            SwitchTab("content-devices-tab");
        }
    });
}

function editSelectedDevices() {
    document.getElementById("process-screen").className = "process_splash";
    var dev_id = new Array();
    for (var i=0;i<devices.length;i++) {
        if (document.getElementById("device-"+devices[i].device_id+"-check").checked === true) {
            dev_id.push(devices[i].device_id);
        }
    }
    var query = "./php/itemedit.php?device_id=" + dev_id.join(',');
    if (document.getElementById("dialogue-input-description").value !== "") {
        query += "&device_description=" + document.getElementById("dialogue-input-description").value;
    }
    if (document.getElementById("dialogue-input-snmp").value !== "") {
        query += "&device_snmpstr=" + document.getElementById("dialogue-input-snmp").value;
    }
    console.log(query);

    getJSON(query,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            SwitchTab("content-devices-tab");
        }
    });
}

function editSelectedDevicesWindow() {
    checked_id = false;
    for (var i=0;i<devices.length;i++) {
        if (document.getElementById("device-"+devices[i].device_id+"-check").checked === true) {
            checked_id = true;
            break;
        }
    }
    if (checked_id) {
        document.getElementById("dialogue-stage").className = "dialogue_stage";
        DelElement("dialogue-body");
        AddElement("div","dialogue-window","dialogue-body","dialogue_body");
        AddElement("div","dialogue-body","dialogue-label","dialogue_label","Edit devices properties");
        AddElement("form","dialogue-body","dialogue-form","dialogue_form");

        AddElement("div","dialogue-form","dialogue-description-row","dialogue_row");
        AddElement("div","dialogue-description-row",null,"dialogue_row_label","Description");
        var attributes = [ {"name": "type", "value": "text"} ];
        AddElement("input","dialogue-description-row","dialogue-input-description","dialogue_row_input");

        AddElement("div","dialogue-form",null,"dialogue_row_spacer");
        AddElement("div","dialogue-form","dialogue-snmp-row","dialogue_row");
        AddElement("div","dialogue-snmp-row",null,"dialogue_row_label","SNMP string");
        var attributes = [ {"name": "type", "value": "text"} ];
        AddElement("input","dialogue-snmp-row","dialogue-input-snmp","dialogue_row_input");

        AddElement("div","dialogue-body","dialogue-bottom-line","dialogue_bottom_line");
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
        var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');editSelectedDevices();"} ];
        AddElement("div","dialogue-bottom-line",null,"dialogue_button","Ok",attributes);
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
        var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');"} ];
        AddElement("div","dialogue-bottom-line",null,"dialogue_button","Cancel",attributes);
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    }
}

function clearInterfacesTab() {
    DelElement('tab-interfaces-table');
    AddElement("div","content_interfaces_tab","tab-interfaces-table","class_table");
    var attributes = [ {"name": "onchange", "value": "updateInterfacesTab();"} ];
    AddElement("form","tab-interfaces-table","interface-device-form","class_table_row",null,attributes);
    AddElement("div","interface-device-form","interface-device-label","class_table_cell_10","Device: ");
    AddElement("select","interface-device-form","interface-device-select","class_table_cell_10");
    var attributes = [ {"name": "onclick", "value": "discoverInterfaces();"} ];
    AddElement("div","interface-device-form","interface-device-discover","dialogue_button","Discover",attributes);
    var attributes = [ {"name": "value", "value": "null"} ];
    AddElement("option","interface-device-select",null,null,"Select",attributes);
    if (devices != null && devices.length > 0) {
        for (var i=0;i<devices.length;i++) {
            if (devices[i].device_enabled == "t") {
                var attributes = [ {"name": "value", "value": devices[i].device_header} ];
                AddElement("option","interface-device-select","interface-device-"+devices[i].device_header,null,intToIP(devices[i].device_header),attributes);
            }
        }
    }
}

function updateInterfacesTab() {
    DelElement("table-interfaces-header");
    DelElement("table-interfaces-body");
    AddElement("div","tab-interfaces-table","table-interfaces-header","class_table_row");
    AddElement("div","table-interfaces-header","header-interfaces-check","class_table_cell_5");
    AddElement("div","table-interfaces-header","header-interfaces-icon","class_table_cell_3","Ico");
    AddElement("div","table-interfaces-header","header-interfaces-id","class_table_cell_5","Id");
    AddElement("div","table-interfaces-header","header-interfaces-name","class_table_cell_15","Name");
    AddElement("div","table-interfaces-header","header-interfaces-alias","class_table_cell_30","Alias");
    AddElement("div","table-interfaces-header","header-interfaces-bandwidth","class_table_cell_20","Bandwidth");
    AddElement("div","table-interfaces-header","header-interfaces-enabled","class_table_cell_10","Enabled");
    AddElement("div","table-interfaces-header","header-interfaces-primary","class_table_cell_10","Primary");
    AddElement("div","tab-interfaces-table","table-interfaces-body","class_table");
    for (var i=0;i<interfaces_categories.length;i++) {
        if (typeof interfaces_categories[i] !== 'undefined') {
            AddElement("div","table-interfaces-body","interfaces-category-row-"+i,"class_table");
            AddElement("div","interfaces-category-row-"+i,"interfaces-category-row-header-"+i,"class_table_row",interfaces_categories[i].name);
            AddElement("div","interfaces-category-row-"+i,"interfaces-category-row-body-"+i,"class_table");
        }
    }
    var dev_id = null;
    if (document.getElementById("interface-device-select")) {
        dev_id = document.getElementById("interface-device-select").value;
        console.log(dev_id);
    }
    if (dev_id !== null && dev_id !== "null" && interfaces !== null && interfaces !== undefined && interfaces.length > 0) {
        for (var i=0;i<interfaces.length;i++) {
            if (interfaces[i].device_id == dev_id) {
                if (interfaces[i].interface_enabled == "t") {
                    AddElement("div","interfaces-category-row-body-0","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"class_table_row");
                    var attributes = [ {"name": "type", "value": "checkbox"} ];
                    AddElement("input","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-check-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_5",null,attributes);
                    var attributes = [ {"name": "src", "value": "img/lime-switch-256.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                    AddElement("img","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-img-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_3",null,attributes);
                } else {
                    AddElement("div","interfaces-category-row-body-1","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"class_table_row");
                    var attributes = [ {"name": "type", "value": "checkbox"} ];
                    AddElement("input","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-check-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_5",null,attributes);
                    var attributes = [ {"name": "src", "value": "img/yellow-switch-256.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                    AddElement("img","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-img-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_3",null,attributes);
                }
                AddElement("div","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-id-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_5",interfaces[i].interface_id);
                AddElement("div","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-name-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_15",interfaces[i].interface_name);
                AddElement("div","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-alias-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_30",interfaces[i].interface_alias);
                AddElement("div","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-bandwidth-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_20",interfaces[i].interface_bandwidth);
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-enabled-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_10",null,attributes);
                AddElement("input","interface-row-"+dev_id+"_"+interfaces[i].interface_id,"interface-primary-"+dev_id+"_"+interfaces[i].interface_id,"class_table_cell_10",null,attributes);
                if (interfaces[i].interface_enabled == "t") {
                    document.getElementById("interface-enabled-"+dev_id+"_"+interfaces[i].interface_id).checked = true;
                }
                if (interfaces[i].interface_primary == "t") {
                    document.getElementById("interface-primary-"+dev_id+"_"+interfaces[i].interface_id).checked = true;
                }
            }
        }
    }
}

function getInterfaces() {
    if (document.getElementById("interface-device-select").value !== "null") {
        var dev_id = document.getElementById("interface-device-select").value;
        console.log(dev_id);

        hideElement("content-interfaces-tab");
        document.getElementById("process-screen").className = "process_splash";

        getJSON("./php/itemlist.php?interfaces",  function(err, data) {
            if (err != null || data == null || data.interfaces == null) {
                console.error(err);
                console.log(data);
            } else {
                interfaces = data.interfaces;
                user = data.user;
                showUserName(user);
                updateInterfacesTab();
            }
            document.getElementById("process-screen").className = "invisible";
            document.getElementById("content-interfaces-tab").className = "visible";
        });
    }
}

function discoverInterfaces() {
    if (document.getElementById("interface-device-select").value !== "null") {
        var dev_id = document.getElementById("interface-device-select").value;
        hideElement("content-interfaces-tab");
        document.getElementById("process-screen").className = "process_splash";

        console.log("./php/itemedit.php?device_id="+dev_id+"&interface_discover");
        getJSON("./php/itemedit.php?device_id="+dev_id+"&interface_discover",  function(err, data) {
            if (err != null || data == null || data.interfaces == null) {
                console.error(err);
                console.log(data);
            } else {
                interfaces = data.interfaces;
                user = data.user;
                showUserName(user);
                updateInterfacesTab();
            }
            document.getElementById("process-screen").className = "invisible";
            document.getElementById("content-interfaces-tab").className = "visible";
        });
    }
}

function addInterfaceDialogue() {
}

function delInterfaceDialogue() {
}

function selectAllInterfaces() {
    if (document.getElementById("interface-device-select").value !== "null") {
        var dev_id = document.getElementById("interface-device-select").value;
        for (var i=0;i<interfaces.length;i++) {
            if (interfaces[i].device_id == dev_id) {
                document.getElementById("interface-check-"+dev_id+"_"+interfaces[i].interface_id).checked = true;
            }
        }
    }
}

function unselectAllInterfaces() {
    if (document.getElementById("interface-device-select").value !== "null") {
        console.log(document.getElementById("interface-device-select").value);
        var dev_id = document.getElementById("interface-device-select").value;
        for (var i=0;i<interfaces.length;i++) {
            if (interfaces[i].device_id == dev_id) {
                document.getElementById("interface-check-"+dev_id+"_"+interfaces[i].interface_id).checked = false;
            }
        }
    }
}

function enableSelectedInterfaces() {
    if (document.getElementById("interface-device-select").value !== "null") {
        var dev_id = document.getElementById("interface-device-select").value;
        document.getElementById("process-screen").className = "process_splash";

        var interface_id = new Array();
        for (var i=0;i<interfaces.length;i++) {
            if (interfaces[i].device_id == dev_id && document.getElementById("interface-check-"+dev_id+"_"+interfaces[i].interface_id).checked === true) {
                interface_id.push(interfaces[i].device_id+"_"+interfaces[i].interface_id);
            }
        }
        var query = "./php/itemedit.php?interface_enable=" + interface_id.join(',');
        console.log(query);

        getJSON(query,  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                getInterfaces();
            }
        });
    }
}

function disableSelectedInterfaces() {
    if (document.getElementById("interface-device-select").value !== "null") {
        var dev_id = document.getElementById("interface-device-select").value;
        document.getElementById("process-screen").className = "process_splash";

        var interface_id = new Array();
        for (var i=0;i<interfaces.length;i++) {
            if (interfaces[i].device_id == dev_id && document.getElementById("interface-check-"+dev_id+"_"+interfaces[i].interface_id).checked === true) {
                interface_id.push(interfaces[i].device_id+"_"+interfaces[i].interface_id);
            }
        }
        var query = "./php/itemedit.php?interface_disable=" + interface_id.join(',');
        console.log(query);

        getJSON(query,  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                getInterfaces();
            }
        });
    }
}

function setPrimarySelectedInterfaces() {
    if (document.getElementById("interface-device-select").value !== "null") {
        var dev_id = document.getElementById("interface-device-select").value;
        document.getElementById("process-screen").className = "process_splash";

        var interface_id = new Array();
        for (var i=0;i<interfaces.length;i++) {
            if (interfaces[i].device_id == dev_id && document.getElementById("interface-check-"+dev_id+"_"+interfaces[i].interface_id).checked === true) {
                interface_id.push(interfaces[i].device_id+"_"+interfaces[i].interface_id);
            }
        }
        var query = "./php/itemedit.php?interface_primary=" + interface_id.join(',');
        console.log(query);

        getJSON(query,  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                getInterfaces();
            }
        });
    }
}

function unsetPrimarySelectedInterfaces() {
    if (document.getElementById("interface-device-select").value !== "null") {
        var dev_id = document.getElementById("interface-device-select").value;
        document.getElementById("process-screen").className = "process_splash";

        var interface_id = new Array();
        for (var i=0;i<interfaces.length;i++) {
            if (interfaces[i].device_id == dev_id && document.getElementById("interface-check-"+dev_id+"_"+interfaces[i].interface_id).checked === true) {
                interface_id.push(interfaces[i].device_id+"_"+interfaces[i].interface_id);
            }
        }
        var query = "./php/itemedit.php?interface_nonprimary=" + interface_id.join(',');
        console.log(query);

        getJSON(query,  function(err, data) {
            if (err != null) {
                console.error(err);
            } else {
                getInterfaces();
            }
        });
    }
}


function clearTemplatesTab() {
    DelElement('tab-v9templates-table')
    AddElement("div","content_template_tab","tab-v9templates-table","class_table");
    AddElement("div","tab-v9templates-table","table-v9templates-header","class_table_row");
    AddElement("div","table-v9templates-header",null,"class_table_cell_5");
    AddElement("div","table-v9templates-header",null,"class_table_cell_5","Ico");
    AddElement("div","table-v9templates-header",null,"class_table_cell_15","Ip addr");
    AddElement("div","table-v9templates-header",null,"class_table_cell_10","ID");
    AddElement("div","table-v9templates-header",null,"class_table_cell","Fields");
    AddElement("div","table-v9templates-header",null,"class_table_cell_10","Sampling");
    AddElement("div","table-v9templates-header",null,"class_table_cell_10","Enabled");
}

function addV9TemplatesCategories() {
    for (var i=0;i<v9templates_categories.length;i++) {
        if (typeof v9templates_categories[i] !== 'undefined') {
            AddElement("div","tab-v9templates-table","v9templates-category-row-"+i,"class_table");
            AddElement("div","v9templates-category-row-"+v9templates_categories[i].id,"v9templates-category-row-header-"+v9templates_categories[i].id,"class_table_row",v9templates_categories[i].name);
            AddElement("div","v9templates-category-row-"+v9templates_categories[i].id,"v9templates-category-row-body-"+v9templates_categories[i].id,"class_table");
        }
    }
}

function addV9Templates() {
//    console.log(v9templates);
    if (typeof v9templates !== 'undefined' && v9templates.length > 0) {
        for (var i=0;i<v9templates.length;i++) {
            if (typeof v9templates[i] !== 'undefined') {
                if (v9templates[i].template_enabled === "t") {
                    AddElement("div","v9templates-category-row-body-0","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_row");
                    var attributes = [ {"name": "type", "value": "checkbox"} ];
                    AddElement("input","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-check-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_5",null,attributes);
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-img-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_5");
                    var attributes = [ {"name": "src", "value": "img/lime-stack-256.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                    AddElement("img","v9templates-img-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-icon-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell",null,attributes);
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-ip-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_15",intToIP(v9templates[i].device_id));
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-id-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_10",v9templates[i].device_id+"_"+v9templates[i].template_id);
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-header-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell",v9templates[i].template_header);
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-sampling-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_10",v9templates[i].template_sampling);
                    var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                    AddElement("input","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-enabled-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_10",null,attributes);
                    document.getElementById("v9templates-enabled-"+v9templates[i].device_id+"_"+v9templates[i].template_id).checked = true;
                } else {
                    AddElement("div","v9templates-category-row-body-1","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_row");
                    var attributes = [ {"name": "type", "value": "checkbox"} ];
                    AddElement("input","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-check-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_5",null,attributes);
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-img-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_5");
                    var attributes = [ {"name": "src", "value": "img/yellow-stack-256.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                    AddElement("img","v9templates-img-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-icon-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell",null,attributes);
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-ip-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_15",intToIP(v9templates[i].device_id));
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-id-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_10",v9templates[i].device_id+"_"+v9templates[i].template_id);
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-header-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell",v9templates[i].template_header);
                    AddElement("div","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-sampling-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_10",v9templates[i].template_sampling);
                    var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                    AddElement("input","v9templates-row-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"v9templates-enabled-"+v9templates[i].device_id+"_"+v9templates[i].template_id,"class_table_cell_10",null,attributes);
                }
            }
        }
    }
}

function selectAllV9Templates() {
    for (var i=0;i<v9templates.length;i++) {
        document.getElementById("v9templates-check-"+v9templates[i].device_id+"_"+v9templates[i].template_id).checked = true;
    }
}

function unselectAllV9Templates() {
    for (var i=0;i<v9templates.length;i++) {
        document.getElementById("v9templates-check-"+v9templates[i].device_id+"_"+v9templates[i].template_id).checked = false;
    }
}

function enableSelectedV9Templates() {
    document.getElementById("process-screen").className = "process_splash";

    var v9template_id = new Array();
    for (var i=0;i<v9templates.length;i++) {
        if (document.getElementById("v9templates-check-"+v9templates[i].device_id+"_"+v9templates[i].template_id).checked === true) {
            v9template_id.push(v9templates[i].device_id+"_"+v9templates[i].template_id);
        }
    }
    var query = "./php/itemedit.php?v9template_enable=" + v9template_id.join(',');
    console.log(query);

    getJSON(query,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            SwitchTab("content-v9templates-tab");
        }
    });

}

function disableSelectedV9Templates() {
    document.getElementById("process-screen").className = "process_splash";

    var v9template_id = new Array();
    for (var i=0;i<v9templates.length;i++) {
        if (document.getElementById("v9templates-check-"+v9templates[i].device_id+"_"+v9templates[i].template_id).checked === true) {
            v9template_id.push(v9templates[i].device_id+"_"+v9templates[i].template_id);
        }
    }
    var query = "./php/itemedit.php?v9template_disable=" + v9template_id.join(',');
    console.log(query);

    getJSON(query,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            SwitchTab("content-v9templates-tab");
        }
    });

}

function editSelectedTemplates() {
    document.getElementById("process-screen").className = "process_splash";
    var v9template_id = new Array();
    for (var i=0;i<v9templates.length;i++) {
        if (document.getElementById("v9templates-check-"+v9templates[i].device_id+"_"+v9templates[i].template_id).checked === true) {
            v9template_id.push(v9templates[i].device_id+"_"+v9templates[i].template_id);
        }
    }
    var query = "./php/itemedit.php?v9template_id=" + v9template_id.join(',');
    if (document.getElementById("dialogue-input-sampling").value !== "") {
        query += "&v9template_sampling=" + document.getElementById("dialogue-input-sampling").value;
    }
    console.log(query);

    getJSON(query,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            SwitchTab("content-v9templates-tab");
        }
    });
}

function editSelectedTemplatesWindow() {
    checked_id = false;
    for (var i=0;i<v9templates.length;i++) {
        if (document.getElementById("v9templates-check-"+v9templates[i].device_id+"_"+v9templates[i].template_id).checked === true) {
            checked_id = true;
            break
        }
    }
    if (checked_id) {
        document.getElementById("dialogue-stage").className = "dialogue_stage";
        DelElement("dialogue-body");
        AddElement("div","dialogue-window","dialogue-body","dialogue_body");
        AddElement("div","dialogue-body","dialogue-label","dialogue_label","Edit v9 template sampling rate");
        AddElement("form","dialogue-body","dialogue-form","dialogue_form");

        AddElement("div","dialogue-form","dialogue-sampling-row","dialogue_row");
        AddElement("div","dialogue-sampling-row",null,"dialogue_row_label","Sampling rate");
        var attributes = [ {"name": "type", "value": "text"} ];
        AddElement("input","dialogue-sampling-row","dialogue-input-sampling","dialogue_row_input");

        AddElement("div","dialogue-body","dialogue-bottom-line","dialogue_bottom_line");
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
        var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');editSelectedTemplates();"} ];
        AddElement("div","dialogue-bottom-line",null,"dialogue_button","Ok",attributes);
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
        var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');"} ];
        AddElement("div","dialogue-bottom-line",null,"dialogue_button","Cancel",attributes);
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    }
}

function clearRawDataTab() {
    DelElement("tab-raw-data-table");

    AddElement("div","content_raw_data_tab","tab-raw-data-table","class_table");
    AddElement("div","tab-raw-data-table","raw-data-query-settings","class_table");
    AddElement("div","tab-raw-data-table","raw-data-body","class_table");

    AddElement("div","raw-data-query-settings","raw-data-source-header","class_table_row");
    AddElement("div","raw-data-source-header",null,"class_table_cell_30","Source: ");

    AddElement("div","raw-data-query-settings","raw-data-source-body","class_table_row");
    AddElement("div","raw-data-source-body","raw-data-source-column-1","class_table_cell_50");
    AddElement("div","raw-data-source-body","raw-data-source-column-2","class_table_cell_50");
    AddElement("div","raw-data-source-column-1","raw-data-device-form","class_table_row");
    AddElement("div","raw-data-device-form",null,"class_table_cell_10");
    AddElement("div","raw-data-device-form",null,"class_table_label_20","Device: ");
    var attributes = [ {"name": "onchange", "value": "updateRawDataDevice(this.value);"} ];
    AddElement("select","raw-data-device-form","raw-data-device-select","class_table_cell_50",null,attributes);
    var attributes = [ {"name": "value", "value": "null"} ];
    AddElement("option","raw-data-device-select",null,null,"Select",attributes);
}

function showRawData() {
    document.getElementById("process-screen").className = "process_splash";

    DelElement("raw-data-body");
    AddElement("div","tab-raw-data-table","raw-data-body","class_table");

    var device_id = document.getElementById("raw-data-device-select").value;
    var template_id = document.getElementById("raw-data-v9templates-select").value;
    var sampling = 1;
    var data_table = device_id;
    if (template_id !== 'null') {
        data_table += "_" + template_id;
        for (var i=0;i<v9templates.length;i++) {
            if(v9templates[i].device_id == device_id && v9templates[i].template_id == template_id) {
                sampling = v9templates[i].template_sampling;
            }
        }
    }
    var query_limit = document.getElementById("raw-data-limit-select").value;
    var time_interval = 300;
    time_interval = document.getElementById("raw-data-time-select").value;
    var time_start = Math.floor(Date.now() / 1000 / 300 ) * 300 - time_interval;
    var time_end = Math.floor(Date.now() / 1000);

    var query = "";
    if (document.getElementById("raw-data-group-form").elements.raw_data_group_by.value == 'none') {
        query = "./php/raw_data.php?ipv4sessions&tbl="+ data_table +"&start=" + time_start + "&end=" + time_end + "&limit=" + query_limit + "&sampling=" + sampling;
    }
    if (document.getElementById("raw-data-group-form").elements.raw_data_group_by.value == 'src') {
        query = "./php/raw_data.php?ipv4sources&tbl="+ data_table +"&start=" + time_start + "&end=" + time_end + "&limit=" + query_limit + "&sampling=" + sampling;
    }
    if (document.getElementById("raw-data-group-form").elements.raw_data_group_by.value == 'dst') {
        query = "./php/raw_data.php?ipv4destinations&tbl="+ data_table +"&start=" + time_start + "&end=" + time_end + "&limit=" + query_limit + "&sampling=" + sampling;
    }
    if (document.getElementById("raw-data-ingress-interface-select").value != 'null') {
        query += "&iif=" + document.getElementById("raw-data-ingress-interface-select").value;
    }
    if (document.getElementById("raw-data-egress-interface-select").value != 'null') {
        query += "&eif=" + document.getElementById("raw-data-egress-interface-select").value;
    }
//    console.log(document.getElementById("raw-data-group-form").elements.raw_data_group_by.value);
    if (document.getElementById("raw-data-sourceip-text").value != '') {
        query += "&srcip="+document.getElementById("raw-data-sourceip-text").value+"/"+document.getElementById("raw-data-sourceip-mask").value;
    }
    if (document.getElementById("raw-data-destinationip-text").value != '') {
        query += "&dstip="+document.getElementById("raw-data-destinationip-text").value+"/"+document.getElementById("raw-data-destinationip-mask").value;
    }
    console.log(query);

    getJSON(query,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            if (data != null && data.data != null) {
                showRawDataDetail(data.data);
            }
            if (data != null && data.group != null) {
                showRawDataGroup(data);
            }
//                console.log(data);
            //document.getElementById("process-splash").className = "invisible";
            document.getElementById("process-screen").className = "invisible";
        }
    });

}

function showRawDataGroup(data) {
}

function showRawDataDetail(data) {
//    var sampling = 1;
//    for (var i=0;i<v9templates.length;i++) {
//        if(v9templates[i].device_id == document.getElementById("raw-data-device-select").value && v9templates[i].template_id == document.getElementById("raw-data-v9templates-select").value) {
//            sampling = v9templates[i].template_sampling;
//        }
//    }
    if (data.totalhosts != null && data.totalhosts.length > 0) {
        AddElement("div","raw-data-body","table-raw-data-chart","class_table_row");
        AddElement("div","raw-data-body","table-raw-data-label","class_header",intToIP(document.getElementById("raw-data-device-select").value) + " - Detailed");
        AddElement("div","raw-data-body","table-raw-data-header","class_table_row");
        AddElement("div","table-raw-data-header",null,"class_table_cell_5");
        AddElement("div","table-raw-data-header",null,"class_table_cell_15","Src IP");
        AddElement("div","table-raw-data-header",null,"class_table_cell_15","Dst IP");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Src port");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Dst port");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Proto");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Bytes");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Packets");

        for (var i=0;i<data.totalhosts.length;i++) {
            var row = data.totalhosts[i];
            var attributes = [ {"name": "style", "value": "font-size:small;border-bottom: 1px solid grey;"} ];
            AddElement("div","raw-data-body","table-raw-data-row-"+i,"class_table_row",null,attributes);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_5");
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_15",row[0]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_15",row[1]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[2]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[3]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",proto_id[row[4]]+"("+row[4]+")");
//            if (sampling > 0) {
//                row[5] *= sampling;
//                row[6] *= sampling;
//            }
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[5]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[6]);
        }
        var row = data.total[0];
        var attributes = [ {"name": "style", "value": "font-size:small;border-bottom: 1px solid grey;"} ];
        AddElement("div","raw-data-body","table-raw-data-row-"+i,"class_table_row",null,attributes);
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_5");
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_40","Total");
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_20");
//        if (sampling > 0) {
//            row[0] *= sampling;
//            row[1] *= sampling;
//        }
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[0]);
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[1]);

        var plotDiv = document.getElementById('plot');
        var traces = new Array();
        traces = data.traces;
        var layout = {
            'title': 'Detailed chart for ' + intToIP(document.getElementById("raw-data-device-select").value),
            'paper_bgcolor': "rgba(0,0,0,0)",
            'plot_bgcolor' : 'rgba(0,0,0,0)'
        };

        Plotly.newPlot('table-raw-data-chart', traces, layout);

    }

    if (data.totalsources != null && data.totalsources.length > 0) {
        AddElement("div","raw-data-body","table-raw-data-chart","class_table_row");
        AddElement("div","raw-data-body","table-raw-data-label","class_header",intToIP(document.getElementById("raw-data-device-select").value) + " - Detailed");
        AddElement("div","raw-data-body","table-raw-data-header","class_table_row");
        AddElement("div","table-raw-data-header",null,"class_table_cell_5");
        AddElement("div","table-raw-data-header",null,"class_table_cell_15","Src IP");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Src port");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Proto");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Bytes");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Packets");

        for (var i=0;i<data.totalsources.length;i++) {
            var row = data.totalsources[i];
            var attributes = [ {"name": "style", "value": "font-size:small;border-bottom: 1px solid grey;"} ];
            AddElement("div","raw-data-body","table-raw-data-row-"+i,"class_table_row",null,attributes);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_5");
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_15",row[0]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[1]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",proto_id[row[2]]+"("+row[2]+")");
//            if (sampling > 0) {
//                row[3] *= sampling;
//                row[4] *= sampling;
//            }
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[3]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[4]);
        }
        var row = data.total[0];
        var attributes = [ {"name": "style", "value": "font-size:small;border-bottom: 1px solid grey;"} ];
        AddElement("div","raw-data-body","table-raw-data-row-"+i,"class_table_row",null,attributes);
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_5");
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_25","Total");
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10");
//        if (sampling > 0) {
//            row[0] *= sampling;
//            row[1] *= sampling;
//        }
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[0]);
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[1]);

        var plotDiv = document.getElementById('plot');
        var traces = new Array();
        traces = data.traces;
        var layout = {
            'title': 'Detailed chart for ' + intToIP(document.getElementById("raw-data-device-select").value),
            'paper_bgcolor': "rgba(0,0,0,0)",
            'plot_bgcolor' : 'rgba(0,0,0,0)'
        };

        Plotly.newPlot('table-raw-data-chart', traces, layout);

    }

    if (data.totaldestinations != null && data.totaldestinations.length > 0) {
        AddElement("div","raw-data-body","table-raw-data-chart","class_table_row");
        AddElement("div","raw-data-body","table-raw-data-label","class_header",intToIP(document.getElementById("raw-data-device-select").value) + " - Detailed");
        AddElement("div","raw-data-body","table-raw-data-header","class_table_row");
        AddElement("div","table-raw-data-header",null,"class_table_cell_5");
        AddElement("div","table-raw-data-header",null,"class_table_cell_15","Dst IP");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Dst port");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Proto");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Bytes");
        AddElement("div","table-raw-data-header",null,"class_table_cell_10","Packets");

        for (var i=0;i<data.totaldestinations.length;i++) {
            var row = data.totaldestinations[i];
            var attributes = [ {"name": "style", "value": "font-size:small;border-bottom: 1px solid grey;"} ];
            AddElement("div","raw-data-body","table-raw-data-row-"+i,"class_table_row",null,attributes);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_5");
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_15",row[0]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[1]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",proto_id[row[2]]+"("+row[2]+")");
//            if (sampling > 0) {
//                row[3] *= sampling;
//                row[4] *= sampling;
//            }
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[3]);
            AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[4]);
        }
        var row = data.total[0];
        var attributes = [ {"name": "style", "value": "font-size:small;border-bottom: 1px solid grey;"} ];
        AddElement("div","raw-data-body","table-raw-data-row-"+i,"class_table_row",null,attributes);
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_5");
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_25","Total");
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10");
//        if (sampling > 0) {
//            row[0] *= sampling;
//            row[1] *= sampling;
//        }
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[0]);
        AddElement("div","table-raw-data-row-"+i,null,"class_table_cell_10",row[1]);

        var plotDiv = document.getElementById('plot');
        var traces = new Array();
        traces = data.traces;
        var layout = {
            'title': 'Detailed chart for ' + intToIP(document.getElementById("raw-data-device-select").value),
            'paper_bgcolor': "rgba(0,0,0,0)",
            'plot_bgcolor' : 'rgba(0,0,0,0)'
        };

        Plotly.newPlot('table-raw-data-chart', traces, layout);
    }
}

function addRawDataDevices() {
    if (typeof devices !== 'undefined' && devices.length > 0) {
        for (var i=0;i<devices.length;i++) {
            if (devices[i].device_enabled == "t") {
                var attributes = [ {"name": "value", "value": devices[i].device_header} ];
                device_name = intToIP(devices[i].device_header);
                if (devices[i].device_description !== "") {
                    device_name += " - " + devices[i].device_description;
                }
                AddElement("option","raw-data-device-select","raw-data-device-"+devices[i].device_header,null,device_name,attributes);
            }
        }
    }
}

function updateRawDataDevice() {
    DelElement("raw-data-v9templates-form");
    DelElement("raw-data-filter-header");
    DelElement("raw-data-filter-body");
    DelElement("raw-data-ingress-interface-form");
    DelElement("raw-data-egress-interface-form");
    DelElement("raw-data-time-form");
    DelElement("raw-data-group-header");
    DelElement("raw-data-group-form");
    DelElement("raw-data-limit-header");
    DelElement("raw-data-limit-form");
    DelElement("raw-data-group-button-row");

    var dev_id = null;
    if (document.getElementById("raw-data-device-select")) {
        dev_id = document.getElementById("raw-data-device-select").value;
        console.log(dev_id);
    }
    if (dev_id !== null && dev_id !== "null") {

        AddElement("div","raw-data-source-column-2","raw-data-v9templates-form","invisible");
        AddElement("div","raw-data-v9templates-form",null,"class_table_cell_10");
        AddElement("div","raw-data-v9templates-form",null,"class_table_label_20","v9 Template: ");
        var attributes = [ {"name": "onchange", "value": "console.log(this.value);"} ];
        AddElement("select","raw-data-v9templates-form","raw-data-v9templates-select","class_table_cell_50",null,attributes);
        var attributes = [ {"name": "value", "value": "null"} ];
        AddElement("option","raw-data-v9templates-select","raw-data-v9templates-select-default",null,"None",attributes);

        if (typeof v9templates !== 'undefined' && v9templates.length > 0) {
            for (var i=0;i < v9templates.length;i++) {
                if (v9templates[i].device_id == dev_id) {
                    if (document.getElementById("raw-data-v9templates-form")) {
                        document.getElementById("raw-data-v9templates-form").className = "class_table_row";
                        DelElement("raw-data-v9templates-select-default");
                    }
                    if (v9templates[i].template_enabled == "t") {
                        var attributes = [ {"name": "value", "value": v9templates[i].template_id} ];
                        AddElement("option","raw-data-v9templates-select",null,null,v9templates[i].template_id,attributes);
                    }
                }
            }
        }


        AddElement("div","raw-data-query-settings","raw-data-filter-header","class_table_row");
        AddElement("div","raw-data-filter-header",null,"class_table_cell_30","Filter options: ");

        AddElement("div","raw-data-query-settings","raw-data-filter-body","class_table_row");
        AddElement("div","raw-data-filter-body","raw-data-filter-column-1","class_table_cell_50");
        AddElement("div","raw-data-filter-body","raw-data-filter-column-2","class_table_cell_50");
        AddElement("div","raw-data-filter-column-1","raw-data-ingress-interface-form","class_table_row");
        AddElement("div","raw-data-ingress-interface-form",null,"class_table_cell_10");
        AddElement("div","raw-data-ingress-interface-form",null,"class_table_label_20","ingress Iface: ");
        var attributes = [ {"name": "onchange", "value": "console.log(this.value);"} ];
        AddElement("select","raw-data-ingress-interface-form","raw-data-ingress-interface-select","class_table_cell_50",null,attributes);
        var attributes = [ {"name": "value", "value": "null"} ];
        AddElement("option","raw-data-ingress-interface-select","raw-data-ingress-interface-select-default-none",null,"None",attributes);

//        console.log(interfaces);
        if (interfaces !== undefined && interfaces !== null && interfaces.length > 0) {
            for (var i=0;i < interfaces.length;i++) {
                if (interfaces[i].device_id == dev_id && interfaces[i].interface_enabled == "t") {
                    DelElement("raw-data-ingress-interface-select-default-none");
                    if (!document.getElementById("raw-data-ingress-interface-select-default")) {
                        var attributes = [ {"name": "value", "value": "null"} ];
                        AddElement("option","raw-data-ingress-interface-select","raw-data-ingress-interface-select-default",null,"Select",attributes);
                    }
                    var interface_label = interfaces[i].interface_id;
                    if (interfaces[i].interface_name != "") {
                        interface_label += " - " + interfaces[i].interface_name;
                    }
                    if (interfaces[i].interface_alias != "") {
                        interface_label += " - " + interfaces[i].interface_alias;
                    }
                    var attributes = [ {"name": "value", "value": interfaces[i].interface_id} ];
                    AddElement("option","raw-data-ingress-interface-select",null,null,interface_label,attributes);
                }
            }
        }

        AddElement("div","raw-data-filter-column-1","raw-data-egress-interface-form","class_table_row");
        AddElement("div","raw-data-egress-interface-form",null,"class_table_cell_10");
        AddElement("div","raw-data-egress-interface-form",null,"class_table_label_20","egress Iface:");
        var attributes = [ {"name": "onchange", "value": "console.log(this.value);"} ];
        AddElement("select","raw-data-egress-interface-form","raw-data-egress-interface-select","class_table_cell_50",null,attributes);
        var attributes = [ {"name": "value", "value": "null"} ];
        AddElement("option","raw-data-egress-interface-select","raw-data-egress-interface-select-default-none",null,"None",attributes);

        if (interfaces !== undefined && interfaces !== null && interfaces.length > 0) {
            for (var i=0;i < interfaces.length;i++) {
                if (interfaces[i].device_id == dev_id && interfaces[i].interface_enabled == "t") {
                    DelElement("raw-data-egress-interface-select-default-none");
                    if (!document.getElementById("raw-data-egress-interface-select-default")) {
                        var attributes = [ {"name": "value", "value": "null"} ];
                        AddElement("option","raw-data-egress-interface-select","raw-data-egress-interface-select-default",null,"Select",attributes);
                    }
                    var interface_label = interfaces[i].interface_id;
                    if (interfaces[i].interface_name != "") {
                        interface_label += " - " + interfaces[i].interface_name;
                    }
                    if (interfaces[i].interface_alias != "") {
                        interface_label += " - " + interfaces[i].interface_alias;
                    }
                    var attributes = [ {"name": "value", "value": interfaces[i].interface_id} ];
                    AddElement("option","raw-data-egress-interface-select",null,null,interface_label,attributes);
                }
            }
        }

        AddElement("div","raw-data-filter-column-1","raw-data-time-form","class_table_row");
        AddElement("div","raw-data-time-form",null,"class_table_cell_10");
        AddElement("div","raw-data-time-form",null,"class_table_label_20","Interval:");
        var attributes = [ {"name": "onchange", "value": "console.log(this.value);"} ];
        AddElement("select","raw-data-time-form","raw-data-time-select","class_table_cell_50",null,attributes);
        var attributes = new Array();
        attributes = [
            [ {"name": "value", "value": 900} ],
            [ {"name": "value", "value": 1800} ],
            [ {"name": "value", "value": 3600} ],
            [ {"name": "value", "value": 3600*2} ],
            [ {"name": "value", "value": 3600*3} ],
            [ {"name": "value", "value": 3600*4} ],
            [ {"name": "value", "value": 3600*5} ],
            [ {"name": "value", "value": 3600*6} ],
            [ {"name": "value", "value": 3600*7} ],
            [ {"name": "value", "value": 3600*8} ],
            [ {"name": "value", "value": 3600*9} ],
            [ {"name": "value", "value": 3600*10} ],
            [ {"name": "value", "value": 3600*11} ],
            [ {"name": "value", "value": 3600*12} ]
        ];
        var inners = new Array();
        inners = [
            "15 min ago",
            "30 min ago",
            "1 hour ago",
            "2 hours ago",
            "3 hours ago",
            "4 hours ago",
            "5 hours ago",
            "6 hours ago",
            "7 hours ago",
            "8 hours ago",
            "9 hours ago",
            "10 hours ago",
            "11 hours ago",
            "12 hours ago"
        ]

        for (var i=0;i<inners.length;i++) {
            AddElement("option","raw-data-time-select",null,null,inners[i],attributes[i]);
        }

        AddElement("div","raw-data-filter-column-2","raw-data-sourceip-form","class_table_row");
        AddElement("div","raw-data-sourceip-form",null,"class_table_cell_10");
        AddElement("div","raw-data-sourceip-form",null,"class_table_label_20","Src IP:");
        var attributes = [ {"name": "type", "value": "text"} ];
        AddElement("input","raw-data-sourceip-form","raw-data-sourceip-text","class_table_cell_50");
        var attributes = [ {"name": "onchange", "value": "console.log(this.value);"} ];
        AddElement("select","raw-data-sourceip-form","raw-data-sourceip-mask","class_table_cell_10",null,attributes);
        for (var i=32;i>0;i--) {
            var attributes = [ {"name": "value", "value": i} ];
            AddElement("option","raw-data-sourceip-mask",null,null,"/"+i,attributes);
        }

        AddElement("div","raw-data-filter-column-2","raw-data-destinationip-form","class_table_row");
        AddElement("div","raw-data-destinationip-form",null,"class_table_cell_10");
        AddElement("div","raw-data-destinationip-form",null,"class_table_label_20","Dst IP:");
        var attributes = [ {"name": "type", "value": "text"} ];
        AddElement("input","raw-data-destinationip-form","raw-data-destinationip-text","class_table_cell_50");
        var attributes = [ {"name": "onchange", "value": "console.log(this.value);"} ];
        AddElement("select","raw-data-destinationip-form","raw-data-destinationip-mask","class_table_cell_10",null,attributes);
        for (var i=32;i>0;i--) {
            var attributes = [ {"name": "value", "value": i} ];
            AddElement("option","raw-data-destinationip-mask",null,null,"/"+i,attributes);
        }

        AddElement("div","raw-data-filter-column-2","raw-data-note1-form","class_table_row");
        AddElement("div","raw-data-note1-form",null,"class_table_cell_10");
        AddElement("div","raw-data-note1-form",null,"class_table_label_20");
        AddElement("div","raw-data-note1-form",null,"class_table_cell_50","*Use '!' symbol to create an exception (!10.)");

        AddElement("div","raw-data-query-settings","raw-data-group-header","class_table_row");
        AddElement("div","raw-data-group-header",null,"class_table_cell_30","Groupby:");

        var attributes = [ {"name": "onchange", "value": "console.log(this.elements.raw_data_group_by.value);"} ]
        AddElement("form","raw-data-query-settings","raw-data-group-form","class_table",null,attributes);

        AddElement("div","raw-data-group-form","raw-data-group-none","class_table_row");
        AddElement("div","raw-data-group-none",null,"class_table_cell_5");
        var attributes = [ {"name": "type", "value": "radio"}, {"name": "value", "value": "none"}, {"name": "name", "value": "raw_data_group_by"} , {"name": "checked", "value": "true"} ];
        AddElement("input","raw-data-group-none",null,"class_table_cell_3",null,attributes);
        AddElement("div","raw-data-group-none",null,"class_table_cell_10","None");

        AddElement("div","raw-data-group-form","raw-data-group-src","class_table_row");
        AddElement("div","raw-data-group-src",null,"class_table_cell_5");
        var attributes = [ {"name": "type", "value": "radio"}, {"name": "value", "value": "src"}, {"name": "name", "value": "raw_data_group_by"} ];
        AddElement("input","raw-data-group-src",null,"class_table_cell_3",null,attributes);
        AddElement("div","raw-data-group-src",null,"class_table_cell_10","Source IP");

        AddElement("div","raw-data-group-form","raw-data-group-dst","class_table_row");
        AddElement("div","raw-data-group-dst",null,"class_table_cell_5");
        var attributes = [ {"name": "type", "value": "radio"}, {"name": "value", "value": "dst"}, {"name": "name", "value": "raw_data_group_by"} ];
        AddElement("input","raw-data-group-dst",null,"class_table_cell_3",null,attributes);
        AddElement("div","raw-data-group-dst",null,"class_table_cell_10","Destination IP");

        AddElement("div","raw-data-query-settings","raw-data-limit-header","class_table_row");
        AddElement("div","raw-data-limit-header",null,"class_table_cell_30","Limit:");

        AddElement("div","raw-data-query-settings","raw-data-limit-form","class_table_row");
        AddElement("div","raw-data-limit-form",null,"class_table_cell_5");
        var attributes = [ {"name": "onchange", "value": "console.log(this.value);"} ];
        AddElement("select","raw-data-limit-form","raw-data-limit-select","class_table_cell_select",null,attributes);
        var attributes = new Array();
        attributes = [
            [ {"name": "value", "value": 20} ],
            [ {"name": "value", "value": 30} ],
            [ {"name": "value", "value": 40} ],
            [ {"name": "value", "value": 50} ],
            [ {"name": "value", "value": 60} ]
        ];
        var inners = new Array();
        inners = [
            "20",
            "30",
            "40",
            "50",
            "60"
        ]

        for (var i=0;i<inners.length;i++) {
            AddElement("option","raw-data-limit-select",null,null,inners[i],attributes[i]);
        }

        AddElement("div","raw-data-query-settings","raw-data-group-button-row","class_table_row");
        AddElement("div","raw-data-group-button-row",null,"class_table_cell_15");
        var attributes = [ {"name": "onclick", "value": "showRawData();"} ];
        AddElement("div","raw-data-group-button-row","raw-data-button","dialogue_button","Show",attributes);
    }
}

function clearAdminTab() {
    DelElement('tab-admin-table');
    AddElement("div","content_admin_tab","tab-admin-table","class_table");
    AddElement("div","tab-admin-table","tab-admin-users-label","class_table_row_label", "Users");
    AddElement("div","tab-admin-table","table-admin-users-header","class_table_row_header");
    AddElement("div","table-admin-users-header",null,"class_table_cell_5");
    AddElement("div","table-admin-users-header",null,"class_table_cell_5","Ico");
    AddElement("div","table-admin-users-header",null,"class_table_cell_5","Id");
    AddElement("div","table-admin-users-header",null,"class_table_cell_15","Name");
    AddElement("div","table-admin-users-header",null,"class_table_cell","Full name");
    AddElement("div","table-admin-users-header",null,"class_table_cell_10","Group");
    AddElement("div","table-admin-users-header",null,"class_table_cell_5","Read");
    AddElement("div","table-admin-users-header",null,"class_table_cell_5","Write");
    AddElement("div","table-admin-users-header",null,"class_table_cell_5","Admin");
    AddElement("div","table-admin-users-header",null,"class_table_cell_5","Enabled");
    var attributes = [ {"name": "onchange", "value": "console.log(this.elements.admin_user_id.value);"} ]
    AddElement("form","tab-admin-table","table-admin-users-form","class_table",null,attributes);
    AddElement("div","table-admin-users-form","table-admin-users-enabled-header","class_table_row_highlight", "Enabled");
    AddElement("div","table-admin-users-form","table-admin-users-enabled-body","class_table");
    AddElement("div","table-admin-users-form","table-admin-users-disabled-header","class_table_row_highlight", "Disabled");
    AddElement("div","table-admin-users-form","table-admin-users-disabled-body","class_table");

    AddElement("div","tab-admin-table","tab-admin-groups-label","class_table_row_label", "Groups");
    AddElement("div","tab-admin-table","table-admin-groups-header","class_table_row_header");
    AddElement("div","table-admin-groups-header",null,"class_table_cell_5");
    AddElement("div","table-admin-groups-header",null,"class_table_cell_5","Ico");
    AddElement("div","table-admin-groups-header",null,"class_table_cell_5","Id");
    AddElement("div","table-admin-groups-header",null,"class_table_cell","Name");
    AddElement("div","table-admin-groups-header",null,"class_table_cell_5","Read");
    AddElement("div","table-admin-groups-header",null,"class_table_cell_5","Write");
    AddElement("div","table-admin-groups-header",null,"class_table_cell_5","Admin");
    AddElement("div","table-admin-groups-header",null,"class_table_cell_5","Enabled");
    var attributes = [ {"name": "onchange", "value": "console.log(this.elements.admin_group_id.value);"} ]
    AddElement("form","tab-admin-table","table-admin-groups-form","class_table",null,attributes);
    AddElement("div","table-admin-groups-form","table-admin-groups-enabled-header","class_table_row_highlight", "Enabled");
    AddElement("div","table-admin-groups-form","table-admin-groups-enabled-body","class_table");
    AddElement("div","table-admin-groups-form","table-admin-groups-disabled-header","class_table_row_highlight", "Disabled");
    AddElement("div","table-admin-groups-form","table-admin-groups-disabled-body","class_table");

}

function addAdminTabUsers() {
    if (typeof groups !== 'undefined' && groups.length > 0) {
        for (var i=0;i < users.length;i++) {
            if (users[i].user_enabled == "t" && users[i].group_enabled == "t") {
                AddElement("div","table-admin-users-enabled-body","table-admin-user-row"+users[i].user_id,"class_table_row");
                var attributes = [ {"name": "type", "value": "radio"}, {"name": "value", "value": users[i].user_id}, {"name": "name", "value": "admin_user_id"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,null,"class_table_cell_5",null,attributes);
                AddElement("div","table-admin-user-row"+users[i].user_id,"table-admin-user-cell"+users[i].user_id+"-ico","class_table_cell_5");
                var attributes = [ {"name": "src", "value": "img/green-user.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                AddElement("img","table-admin-user-cell"+users[i].user_id+"-ico",null,"class_table_cell",null,attributes);
            } else {
                AddElement("div","table-admin-users-disabled-body","table-admin-user-row"+users[i].user_id,"class_table_row");
                var attributes = [ {"name": "type", "value": "radio"}, {"name": "value", "value": users[i].user_id}, {"name": "name", "value": "admin_user_id"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,null,"class_table_cell_5",null,attributes);
                AddElement("div","table-admin-user-row"+users[i].user_id,"table-admin-user-cell"+users[i].user_id+"-ico","class_table_cell_5");
                var attributes = [ {"name": "src", "value": "img/yellow-user.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                AddElement("img","table-admin-user-cell"+users[i].user_id+"-ico",null,"class_table_cell",null,attributes);
            }
            AddElement("div","table-admin-user-row"+users[i].user_id,null,"class_table_cell_5",users[i].user_id);
            AddElement("div","table-admin-user-row"+users[i].user_id,null,"class_table_cell_15",users[i].user_name);
            AddElement("div","table-admin-user-row"+users[i].user_id,null,"class_table_cell",users[i].user_name_full);
            AddElement("div","table-admin-user-row"+users[i].user_id,null,"class_table_cell_10",users[i].group_name);
            if (users[i].group_reader == "t") {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,"table-admin-user-cell"+users[i].user_id+"-reader","class_table_cell_5",null,attributes);
                document.getElementById("table-admin-user-cell"+users[i].user_id+"-reader").checked = true;
            } else {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,null,"class_table_cell_5",null,attributes);
            }
            if (users[i].group_writer == "t") {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,"table-admin-user-cell"+users[i].user_id+"-writer","class_table_cell_5",null,attributes);
                document.getElementById("table-admin-user-cell"+users[i].user_id+"-writer").checked = true;
            } else {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,null,"class_table_cell_5",null,attributes);
            }
            if (users[i].group_admin == "t") {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,"table-admin-user-cell"+users[i].user_id+"-admin","class_table_cell_5",null,attributes);
                document.getElementById("table-admin-user-cell"+users[i].user_id+"-admin").checked = true;
            } else {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,null,"class_table_cell_5",null,attributes);
            }
            if (users[i].user_enabled == "t"  && users[i].group_enabled == "t") {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,"table-admin-user-cell"+users[i].user_id+"-enabled","class_table_cell_5",null,attributes);
                document.getElementById("table-admin-user-cell"+users[i].user_id+"-enabled").checked = true;
            } else {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-user-row"+users[i].user_id,null,"class_table_cell_5",null,attributes);
            }
        }
    }
}

function addAdminTabGroups() {
    if (typeof groups !== 'undefined' && groups.length > 0) {
        for (var i=0;i < groups.length;i++) {
            if (groups[i].group_enabled == "t") {
                AddElement("div","table-admin-groups-enabled-body","table-admin-group-row"+groups[i].group_id,"class_table_row");
                AddElement("div","table-admin-group-row"+groups[i].group_id,null,"class_table_cell_5");
                AddElement("div","table-admin-group-row"+groups[i].group_id,"table-admin-group-cell"+groups[i].group_id+"-ico","class_table_cell_5");
                var attributes = [ {"name": "src", "value": "img/green-group.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                AddElement("img","table-admin-group-cell"+groups[i].group_id+"-ico",null,"class_table_cell",null,attributes);
            } else {
                AddElement("div","table-admin-groups-disabled-body","table-admin-group-row"+groups[i].group_id,"class_table_row");
                AddElement("div","table-admin-group-row"+groups[i].group_id,null,"class_table_cell_5");
                AddElement("div","table-admin-group-row"+groups[i].group_id,"table-admin-group-cell"+groups[i].group_id+"-ico","class_table_cell_5");
                var attributes = [ {"name": "src", "value": "img/yellow-group.png"}, {"name": "style", "value": style="width:25px;height:25px;"} ];
                AddElement("img","table-admin-group-cell"+groups[i].group_id+"-ico",null,"class_table_cell",null,attributes);
            }

            AddElement("div","table-admin-group-row"+groups[i].group_id,null,"class_table_cell_5",groups[i].group_id);
            AddElement("div","table-admin-group-row"+groups[i].group_id,null,"class_table_cell",groups[i].group_name);
            if (groups[i].group_reader == "t") {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-group-row"+groups[i].group_id,"table-admin-group-cell"+groups[i].group_id+"-reader","class_table_cell_5",null,attributes);
                document.getElementById("table-admin-group-cell"+groups[i].group_id+"-reader").checked = true;
            } else {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-group-row"+groups[i].group_id,null,"class_table_cell_5",null,attributes);
            }
            if (groups[i].group_writer == "t") {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-group-row"+groups[i].group_id,"table-admin-group-cell"+groups[i].group_id+"-writer","class_table_cell_5",null,attributes);
                document.getElementById("table-admin-group-cell"+groups[i].group_id+"-writer").checked = true;
            } else {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-group-row"+groups[i].group_id,null,"class_table_cell_5",null,attributes);
            }
            if (groups[i].group_admin == "t") {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-group-row"+groups[i].group_id,"table-admin-group-cell"+groups[i].group_id+"-admin","class_table_cell_5",null,attributes);
                document.getElementById("table-admin-group-cell"+groups[i].group_id+"-admin").checked = true;
            } else {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-group-row"+groups[i].group_id,null,"class_table_cell_5",null,attributes);
            }
            if (groups[i].group_enabled == "t") {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-group-row"+groups[i].group_id,"table-admin-group-cell"+groups[i].group_id+"-enabled","class_table_cell_5",null,attributes);
                document.getElementById("table-admin-group-cell"+groups[i].group_id+"-enabled").checked = true;
            } else {
                var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
                AddElement("input","table-admin-group-row"+groups[i].group_id,null,"class_table_cell_5",null,attributes);
            }
        }
    }
}

function delUser() {
    user_id = document.getElementById("table-admin-users-form").elements.admin_user_id.value;
    hideElement('dialogue-stage');

    document.getElementById("process-screen").className = "process_splash";
    var query = "./php/admin.php";
    var post = "userdel&userid=" + user_id;

    postJSON(query, post,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            document.getElementById("process-screen").className = "invisible";
            SwitchTab(current_tab);
        }
    });
}

function delUserDialogue() {
//    console.log(document.getElementById("table-admin-users-form").elements.admin_user_id.value);
    if (document.getElementById("table-admin-users-form").elements.admin_user_id.value != null && document.getElementById("table-admin-users-form").elements.admin_user_id.value !== '') {
        document.getElementById("dialogue-stage").className = "dialogue_stage";
        DelElement("dialogue-body")
        AddElement("div","dialogue-window","dialogue-body","dialogue_body");

        AddElement("div","dialogue-body","dialogue-label","dialogue_label","User delete confirmation");
        AddElement("form","dialogue-body","dialogue-form","dialogue_form");

        AddElement("div","dialogue-form","dialogue-login-row","dialogue_row");
        var attributes = [ {"name": "style", "value": "text-align:center;width:100%;"} ];
        AddElement("div","dialogue-login-row",null,"dialogue_row_label","Are you sure that you want to delete user?", attributes);

        AddElement("div","dialogue-body","dialogue-bottom-line","dialogue_bottom_line");
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
        var attributes = [ {"name": "onclick", "value": "delUser();"} ];
        AddElement("div","dialogue-bottom-line",null,"dialogue_button","Yes",attributes);
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
        var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');"} ];
        AddElement("div","dialogue-bottom-line",null,"dialogue_button","No",attributes);
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    }
}

function addUser() {
    user         = document.getElementById('dialogue-input-login').value;
    pass         = document.getElementById('dialogue-input-password').value;
    groupid      = document.getElementById("dialogue-input-group").value;
    user_enabled = document.getElementById("dialogue-input-enabled").checked;
    hideElement('dialogue-stage');

    document.getElementById("process-screen").className = "process_splash";
    var query = "./php/admin.php";
    var post = "useradd&user=" + user +  "&pass=" + pass + "&groupid=" + groupid + "&user_enabled=" + user_enabled;

    postJSON(query, post,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            document.getElementById("process-screen").className = "invisible";
            SwitchTab(current_tab);
        }
    });
}

function addUserDialogue() {
    document.getElementById("dialogue-stage").className = "dialogue_stage";
    DelElement("dialogue-body")
    AddElement("div","dialogue-window","dialogue-body","dialogue_body");

    AddElement("div","dialogue-body","dialogue-label","dialogue_label","Create new user");
    AddElement("form","dialogue-body","dialogue-form","dialogue_form");

    AddElement("div","dialogue-form","dialogue-login-row","dialogue_row");
    AddElement("div","dialogue-login-row",null,"dialogue_row_label","Login");
    var attributes = [ {"name": "type", "value": "text"} ];
    AddElement("input","dialogue-login-row","dialogue-input-login","dialogue_row_input",null,attributes);

    AddElement("div","dialogue-form",null,"dialogue_row_spacer");

    AddElement("div","dialogue-form","dialogue-password-row","dialogue_row");
    AddElement("div","dialogue-password-row",null,"dialogue_row_label","Password");
    var attributes = [ {"name": "type", "value": "password"} ];
    AddElement("input","dialogue-password-row","dialogue-input-password","dialogue_row_input",null,attributes);

    AddElement("div","dialogue-form",null,"dialogue_row_spacer");

    AddElement("div","dialogue-form","dialogue-group-row","dialogue_row");
    AddElement("div","dialogue-group-row",null,"dialogue_row_label","Group");
    var attributes = [ {"name": "onchange", "value": "console.log(this.value);"} ];
    AddElement("select","dialogue-group-row","dialogue-input-group","dialogue_row_input",null,attributes);
    for (var i=0;i < groups.length;i++) {
        if (groups[i].group_enabled == "t") {
            var attributes = [ {"name": "value", "value": groups[i].group_id} ];
            AddElement("option","dialogue-input-group",null,null,groups[i].group_name,attributes);
        }
    }
    AddElement("div","dialogue-form",null,"dialogue_row_spacer");

    AddElement("div","dialogue-form","dialogue-enabled-row","dialogue_row");
    AddElement("div","dialogue-enabled-row",null,"dialogue_row_label","Enabled");
    var attributes = [ {"name": "type", "value": "checkbox"}, { "name": "onclick", "value": "return false;"} ];
    AddElement("input","dialogue-enabled-row","dialogue-input-enabled","class_table_cell_5",null,attributes);
    document.getElementById("dialogue-input-enabled").checked = true;

    AddElement("div","dialogue-body","dialogue-bottom-line","dialogue_bottom_line");
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    var attributes = [ {"name": "onclick", "value": "addUser();"} ];
    AddElement("div","dialogue-bottom-line",null,"dialogue_button","Ok",attributes);
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');"} ];
    AddElement("div","dialogue-bottom-line",null,"dialogue_button","Cancel",attributes);
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
}

function editSelectedUser() {
    var query = "./php/admin.php";
    var post = "useredit&userid=" + document.getElementById('dialogue-input-id').value;
    if (document.getElementById('dialogue-input-password').value != 'null') {
        post += "&pass=" + document.getElementById('dialogue-input-password').value;
    }
    if (document.getElementById('dialogue-input-description').value != 'null') {
        post += "&description=" + document.getElementById('dialogue-input-description').value;
    }
    post += "&groupid=" + document.getElementById("dialogue-input-group").value;
    console.log(post);
    hideElement('dialogue-stage');
    document.getElementById("process-screen").className = "process_splash";

    postJSON(query, post,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            document.getElementById("process-screen").className = "invisible";
            SwitchTab(current_tab);
        }
    });
}

function editSelectedUserWindow() {
    if (document.getElementById("table-admin-users-form").elements.admin_user_id.value != null && document.getElementById("table-admin-users-form").elements.admin_user_id.value !== '') {
        var selected_user = null;
        for (var i=0;i < users.length;i++) {
            if (users[i].user_id == document.getElementById("table-admin-users-form").elements.admin_user_id.value) {
                selected_user = users[i];
            }
        }
        document.getElementById("dialogue-stage").className = "dialogue_stage";
        DelElement("dialogue-body")
        AddElement("div","dialogue-window","dialogue-body","dialogue_body");
        AddElement("div","dialogue-body","dialogue-label","dialogue_label","Edit user");
        AddElement("form","dialogue-body","dialogue-form","dialogue_form");

        AddElement("div","dialogue-form","dialogue-login-row","dialogue_row");
        AddElement("div","dialogue-login-row",null,"dialogue_row_label","Login");
        var attributes = [ {"name": "type", "value": "text"}, {"name": "disabled", "value": "disabled"}, {"name": "value", "value": selected_user.user_name} ];
        AddElement("input","dialogue-login-row","dialogue-input-login","dialogue_row_input",null,attributes);
        AddElement("div","dialogue-form",null,"dialogue_row_spacer");

        AddElement("div","dialogue-form","dialogue-id-row","dialogue_row");
        AddElement("div","dialogue-id-row",null,"dialogue_row_label","Id");
        var attributes = [ {"name": "type", "value": "text"}, {"name": "disabled", "value": "disabled"}, {"name": "value", "value": selected_user.user_id} ];
        AddElement("input","dialogue-id-row","dialogue-input-id","dialogue_row_input",null,attributes);
        AddElement("div","dialogue-form",null,"dialogue_row_spacer");

        AddElement("div","dialogue-form","dialogue-password-row","dialogue_row");
        AddElement("div","dialogue-password-row",null,"dialogue_row_label","Password");
        var attributes = [ {"name": "type", "value": "password"}, {"name": "value", "value": "null"} ];
        AddElement("input","dialogue-password-row","dialogue-input-password","dialogue_row_input",null,attributes);
        AddElement("div","dialogue-form",null,"dialogue_row_spacer");

        AddElement("div","dialogue-form","dialogue-description-row","dialogue_row");
        AddElement("div","dialogue-description-row",null,"dialogue_row_label","Description");
        var attributes = [ {"name": "type", "value": "text"}, {"name": "value", "value": selected_user.user_name_full} ];
        AddElement("input","dialogue-description-row","dialogue-input-description","dialogue_row_input",null,attributes);
        AddElement("div","dialogue-form",null,"dialogue_row_spacer");

        AddElement("div","dialogue-form","dialogue-group-row","dialogue_row");
        AddElement("div","dialogue-group-row",null,"dialogue_row_label","Group");
        AddElement("select","dialogue-group-row","dialogue-input-group","dialogue_row_input",null,attributes);
        var attributes = [ {"name": "value", "value": selected_user.group_id} ];
        AddElement("option","dialogue-input-group",null,null,selected_user.group_name,attributes);
        for (var i=0;i < groups.length;i++) {
            if (groups[i].group_id != selected_user.group_id) {
                var attributes = [ {"name": "value", "value": groups[i].group_id} ];
                AddElement("option","dialogue-input-group",null,null,groups[i].group_name,attributes);
            }
        }
        AddElement("div","dialogue-body","dialogue-bottom-line","dialogue_bottom_line");
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
        var attributes = [ {"name": "onclick", "value": "editSelectedUser();"} ];
        AddElement("div","dialogue-bottom-line",null,"dialogue_button","Confirm",attributes);
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
        var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');"} ];
        AddElement("div","dialogue-bottom-line",null,"dialogue_button","Cancel",attributes);
        AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    }
}

function login(usr,pass) {
    document.getElementById("process-screen").className = "process_splash";
    var query = "./php/auth.php";
    var post = "login&usr=" + usr +  "&pass=" + pass;

    postJSON(query, post,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            document.getElementById("process-screen").className = "invisible";
            current_tab = "content-dashboard-tab";
            SwitchTab(current_tab);
        }
    });
}

function logout() {
    document.getElementById("process-screen").className = "process_splash";
    var query = "./php/auth.php?logout";
//    console.log(query);
    getJSON(query,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
//            console.log(data);
            document.getElementById("process-screen").className = "invisible";
            current_tab = "content-dashboard-tab";
            SwitchTab(current_tab);
        }
    });
}

function showLoginForm() {
    document.getElementById("dialogue-stage").className = "dialogue_stage";
    DelElement("dialogue-body")
    AddElement("div","dialogue-window","dialogue-body","dialogue_body");

    AddElement("div","dialogue-body","dialogue-label","dialogue_label","Login form");
    AddElement("form","dialogue-body","dialogue-form","dialogue_form");

    AddElement("div","dialogue-form","dialogue-login-row","dialogue_row");
    AddElement("div","dialogue-login-row",null,"dialogue_row_label","Login");
    var attributes = [ {"name": "type", "value": "text"} ];
    AddElement("input","dialogue-login-row","dialogue-input-login","dialogue_row_input",null,attributes);

    AddElement("div","dialogue-form",null,"dialogue_row_spacer");

    AddElement("div","dialogue-form","dialogue-password-row","dialogue_row");
    AddElement("div","dialogue-password-row",null,"dialogue_row_label","Password");
    var attributes = [ {"name": "type", "value": "password"} ];
    AddElement("input","dialogue-password-row","dialogue-input-password","dialogue_row_input",null,attributes);

    AddElement("div","dialogue-body","dialogue-bottom-line","dialogue_bottom_line");
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    var attributes = [ {"name": "onclick", "value": "usr=document.getElementById('dialogue-input-login').value;pass=document.getElementById('dialogue-input-password').value;hideElement('dialogue-stage');login(usr,pass);"} ];
    AddElement("div","dialogue-bottom-line",null,"dialogue_button","Ok",attributes);
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
    var attributes = [ {"name": "onclick", "value": "hideElement('dialogue-stage');"} ];
    AddElement("div","dialogue-bottom-line",null,"dialogue_button","Cancel",attributes);
    AddElement("div","dialogue-bottom-line",null,"dialogue_vertical_spacer");
}

function showUserName(user) {
    if (typeof user !== 'undefined' && typeof user.user_name !== 'undefined') {
        document.getElementById("login-button").className = "invisible";
        document.getElementById("logout-button").className = "toolbar_item";
        document.getElementById("logout-label").innerHTML = "("+user.user_name+")<br/>Logout";
    } else {
        document.getElementById("login-button").className = "toolbar_item";
        document.getElementById("logout-button").className = "invisible";
    }
}

function intToIP(int) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}
