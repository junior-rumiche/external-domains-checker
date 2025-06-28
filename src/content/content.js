(function () {
    const current_domain = window.location.hostname;
    const all_links = Array.from(document.querySelectorAll('a'));


    const external_links = all_links.filter(link => {
        try {
            const link_hostname = new URL(link.href).hostname;
            return link_hostname !== current_domain && link_hostname !== '';
        } catch (e) {
            return false;
        }
    });

    return external_links.map(link => link.href);
})();
