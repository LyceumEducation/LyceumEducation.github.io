(function () {
    "use strict";

    if (sessionStorage.getItem("lyceum.adminClearance") !== "granted") {
        window.location.replace("index.html");
    }
})();
