const logger = (message, data) => {
    console.log(`[External Domain Checker Popup] ${message}`, data || '');
};



/**
 * Handles the document's 'DOMContentLoaded' event.
 * Gets references to the UI elements, adds event listeners, and sets up the popup's state.
 * @listens DOMContentLoaded
 * 
 */
document.addEventListener('DOMContentLoaded', () => {
    const links_list = document.getElementById('links-list');
    const check_links_btn = document.getElementById('check-links-btn');
    const current_domain_span = document.getElementById('current-domain');



    /**
     * Copies a given text to the user's clipboard, and updates a tooltip of a given button to 'Copied!'
     * for 2 seconds, then sets it back to 'Copy URL'.
     * If the copy operation fails, logs the error.
     * @param {string} text - The text to copy to the user's clipboard.
     * @param {HTMLElement} button - The button to update the tooltip of.
     */
    const copyToClipboard = (text, button) => {
        navigator.clipboard.writeText(text).then(() => {
            const tooltip = button.querySelector('.tooltiptext');
            tooltip.textContent = 'Copied!';

            setTimeout(() => {
                tooltip.textContent = 'Copy URL';
            }, 2000);
        }).catch(err => {
            logger('Failed to copy text: ', err);
        });
    };

    /**
     * Creates a list item for a link that contains an anchor element and a copy-to-clipboard button.
     * @param {string} link - The URL of the link to create an item for.
     * @returns {HTMLElement} The created list item element.
     */
    const createLinkItem = (link) => {
        const list_item = document.createElement('li');
        const link_container = document.createElement('div');
        link_container.className = 'link-item';

        const link_anchor = document.createElement('a');
        link_anchor.href = link;
        link_anchor.textContent = link;
        link_anchor.target = '_blank';
        link_anchor.title = 'Open link in new tab';

        const copy_btn = document.createElement('button');
        copy_btn.className = 'copy-btn tooltip';
        copy_btn.innerHTML = '<i class="fas fa-copy"></i><span class="tooltiptext">Copy URL</span>';
        copy_btn.addEventListener('click', (e) => {
            e.preventDefault();
            copyToClipboard(link, copy_btn);
        });

        link_container.appendChild(link_anchor);
        link_container.appendChild(copy_btn);
        list_item.appendChild(link_container);

        return list_item;
    };

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const url = new URL(tabs[0].url);
        current_domain_span.textContent = url.hostname;
    });


    check_links_btn.addEventListener('click', () => {
        links_list.innerHTML = '';
        check_links_btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';

        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            browser.tabs.executeScript(tabs[0].id, { file: '/src/content/content.js' })
                .then(results => {
                    const links = results[0];

                    check_links_btn.innerHTML = '<i class="fas fa-search"></i> Scan for External Links';

                    if (links.length > 0) {
                        links.forEach(link => {
                            const list_item = createLinkItem(link);
                            links_list.appendChild(list_item);
                        });
                    } else {
                        const list_item = document.createElement('li');
                        list_item.innerHTML = '<div class="link-item"><a>No external links found.</a></div>';
                        links_list.appendChild(list_item);
                    }
                })
                .catch(error => {
                    logger('Error executing content script:', error);
                    check_links_btn.innerHTML = '<i class="fas fa-search"></i> Scan for External Links';

                    const list_item = document.createElement('li');
                    list_item.innerHTML = '<div class="link-item"><a>Error scanning links. Please try again.</a></div>';
                    links_list.appendChild(list_item);
                });
        });
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            check_links_btn.click();
        }
    });
});
