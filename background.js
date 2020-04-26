class Form {
    constructor(name, action_form) {
        this.name = name;
        this.action_form = action_form;
        this.state = {
            action_name: null,
            action_value: null,
            action_error: null
        }
        this.actions = [];
        this.localStorageKey = this.name;
        action_form.addEventListener("submit", (e) => this.submitHandler(e));
        action_form.addEventListener("change", (e) => this.changeHandler(e));
    }
    submitHandler = (e) => {
        e.preventDefault();
        let isValid = this.validateForm();
        if (isValid === true) {
            this.setAction();
        }
    }
    // Handle form input change
    changeHandler = (e) => {
        this.state = {
            ...this.state,
            [e.target.name]: e.target.value
        }
    }
    // Validate the form and show error on dom
    validateForm = () => {
        if (this.state.action_value === null || this.state.action_value.trim() === "") {
            this.state.error = "Action Value is required";
        }
        else if (this.validateQueryParam(this.state.action_value) == false) {
            this.state.error = "Invalid Action Value format";
        }
        else if (this.state.action_name === null || this.state.action_name.trim() === "") {
            this.state.error = "Action Name is required";
        }
        else {
            if (this.actions.length > 0) {
                for (let i = 0; i < actions.length; i++) {
                    if (this.actions[i].action_name == this.state.action_name) {
                        this.state.error = "Action with this name already exists, please use a unique name";
                    }
                    else {
                        this.state.error = null;
                    }
                }
            } else {
                this.state.error = null;
            }
        }

        if (this.state.error != null) {
            document.getElementById('action_error').innerHTML = this.state.error;
            return false;
        } else {
            document.getElementById('action_error').innerHTML = "";
            return true;
        }
    }
    validateQueryParam = (params) => {
        params = params.replace('?', '');
        params = params.split('&');

        let re = /([\w\d])+?=([\w\d])+/
        for (let i = 0; i < params.length; i++) {
            if (re.test(params[i]) == false) {
                return false;
            }
        }
        return true;
    }
    setAction = () => {
        let current_action = { action_name: this.state.action_name, action_value: this.state.action_value }
        this.actions.push(current_action);
        chrome.storage.sync.set({ [this.localStorageKey]: JSON.stringify(this.actions) }, () => {
            document.getElementById('action_success').style.display = 'block';
            document.getElementById('action_success').innerHTML = 'Successfully Created Action.';
            document.getElementById('action_name').value = "";
            document.getElementById('action_value').value = "";
            this.initializeActionButtons();

            setTimeout(() => {
                document.getElementById('action_success').style.display = 'none';
            }, 3000)
        });
    }
    // Responsible for loading saved action buttons
    initializeActionButtons = () => {
        document.getElementById('created-actions-container').innerHTML = "";
        if (this.actions.length > 0) {
            document.getElementById('action_status_label').innerHTML = "Your Actions"
            for (let i = 0; i < this.actions.length; i++) {
                // create a action object and then call the getAction function
                let div = new Action(this.actions[i].action_name,this.actions[i].action_value, this).getAction();
                document.getElementById('created-actions-container').appendChild(div)
            }
        } else{
            document.getElementById('action_status_label').innerHTML = "No actions Created Yet !"
        }
    }
    loadActions = () => {
        chrome.storage.sync.get([this.localStorageKey], (result) => {
            if (result.hasOwnProperty(this.localStorageKey)) {
                this.actions = JSON.parse(result[this.localStorageKey]);
            }
            this.initializeActionButtons()
        });
    }
    deleteAction = (name) => {
        this.actions = this.actions.filter((action) => {
            return action.action_name != name
        })
        chrome.storage.sync.set({ [this.localStorageKey]: JSON.stringify(this.actions) }, () => {
            document.getElementById('action_success').style.display = 'block';
            document.getElementById('action_success').innerHTML = 'Successfully Deleted Action: ' + name;
            this.initializeActionButtons();

            setTimeout(() => {
                document.getElementById('action_success').style.display = 'none';
            }, 3000)
        });
    }
}
class Action{
    constructor(name,value, parent){
        this.name = name;
        this.value = value;
        this.parent = parent;
    }
    getAction() {
        let div = document.createElement('div');
        div.className = "action-group";
        let btn = document.createElement('button');
        btn.innerHTML = this.name;
        btn.className = "btn";
        btn.addEventListener('click', () => {
            this.change_mode(this.value);
        })
        let btn2 = document.createElement('button');
        btn2.innerHTML = "X"
        btn2.className = "btn btnDelete";
        btn2.addEventListener('click', () => {
            this.parent.deleteAction(this.name);
        })
        div.appendChild(btn)
        div.appendChild(btn2)
        return div;
    }
    change_mode = (mode) => {
        chrome.tabs.getSelected(null, (tab) => {

            let url = tab.url.split('?')
            let base = url[0];
            let params = url.length > 1 ? url[1] : null

            let m_dict = this.getParamsDict(mode)
            let p_dict = {}
            if (params != null) {
                p_dict = this.getParamsDict(params);
            }

            params = { ...p_dict, ...m_dict };
            params = this.convertObjectToUrlString(params)
            let newUrl = base + params
            chrome.tabs.update(tab.id, { url: newUrl })
        });
    }
    
    getParamsDict = (p_string) => {
        let params = p_string.replace('?', '').split("&");
        let p_dict = {}
        for (let i = 0; i < params.length; i++) {
            let param = params[i].split("=")
            p_dict[param[0]] = param[1]
        }
        return p_dict;
    }
    convertObjectToUrlString = (obj) => {
        let url = "?"
        for (let [key, value] of Object.entries(obj)) {
            url += `${key}=${value}&`;
        }
        if (url.length > 1) {
            url = url.substr(0, url.length - 1);
        }
        return url;
    }
}
(function () {
    chrome.tabs.getSelected(null, (tab) => {
        let url = tab.url.split('?')[0];
        let id="action-form"
        let form = new Form(url,document.getElementById(id));
        // Initializing 
        form.loadActions();
    });
}())
