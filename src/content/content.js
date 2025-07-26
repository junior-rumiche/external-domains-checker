(() => {
    /**
     * @returns {Array<string>} - An array of external link URLs.
     */
    const getExternalLinks = () => {
        const currentHostname = window.location.hostname;
        const allLinks = Array.from(document.querySelectorAll('a'));

        return allLinks
            .map(link => link.href)
            .filter(href => {
                try {
                    const linkHostname = new URL(href).hostname;
                    return linkHostname !== currentHostname && linkHostname !== '';
                } catch (error) {
                    // Ignore invalid URLs.
                    return false;
                }
            });
    };

    return getExternalLinks();
})();
