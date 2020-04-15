(function () {

    let M_Mode = document.getElementById("m-mode");
    let D_Mode = document.getElementById("d-mode");
    M_Mode.addEventListener("click", () => { this.change_mode("m=t"); });
    D_Mode.addEventListener("click", () => { this.change_mode("m=f"); });
    change_mode = (param) => {
        chrome.tabs.getSelected(null, (tab)=>{
            let newUrl = tab.url;
            if(newUrl.indexOf('?') == -1){
                newUrl = newUrl + '?'+param;
            } else{
                newUrl = newUrl + '&' + param;
            }
            console.log(">>>>>>")
            chrome.tabs.update(tab.id, { url: newUrl })
        });
    }
}())