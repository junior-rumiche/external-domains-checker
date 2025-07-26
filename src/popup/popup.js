const UIMessages = {
    SCANNING: '<i class="fas fa-spinner fa-spin"></i> Scanning...',
    DEFAULT: '<i class="fas fa-search"></i> Scan for External Links',
    NO_LINKS_FOUND: '<div class="link-item"><a>No external links found.</a></div>',
    ERROR_SCANNING: '<div class="link-item"><a>Error scanning links. Please try again.</a></div>',
};

const logger = (message, data) => {
    console.log(`[External Domain Checker Popup] ${message}`, data || '');
};

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

const createLinkItem = (link) => {
    const listItem = document.createElement('li');
    const linkContainer = document.createElement('div');
    linkContainer.className = 'link-item';

    const linkAnchor = document.createElement('a');
    linkAnchor.href = link;
    linkAnchor.textContent = link;
    linkAnchor.target = '_blank';
    linkAnchor.title = 'Open link in new tab';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn tooltip';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i><span class="tooltiptext">Copy URL</span>';
    copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        copyToClipboard(link, copyBtn);
    });

    linkContainer.appendChild(linkAnchor);
    linkContainer.appendChild(copyBtn);
    listItem.appendChild(linkContainer);

    return listItem;
};

const displayLinks = (links, container) => {
    container.innerHTML = '';
    if (links && links.length > 0) {
        links.forEach(link => {
            const listItem = createLinkItem(link);
            container.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.innerHTML = UIMessages.NO_LINKS_FOUND;
        container.appendChild(listItem);
    }
};

const executeContentScript = async (tabId) => {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/content/content.js']
        });
        return results[0].result;
    } catch (error) {
        logger('Error executing content script:', error);
        throw error;
    }
};

const handleScanButtonClick = async (linksList, checkLinksBtn) => {
    linksList.innerHTML = '';
    checkLinksBtn.innerHTML = UIMessages.SCANNING;

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const links = await executeContentScript(tabs[0].id);
        displayLinks(links, linksList);
    } catch (error) {
        const listItem = document.createElement('li');
        listItem.innerHTML = UIMessages.ERROR_SCANNING;
        linksList.appendChild(listItem);
    } finally {
        checkLinksBtn.innerHTML = UIMessages.DEFAULT;
    }
};

const setPopupState = async (currentDomainSpan) => {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url);
        currentDomainSpan.textContent = url.hostname;
    } catch (error) {
        logger('Error setting popup state:', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const linksList = document.getElementById('links-list');
    const checkLinksBtn = document.getElementById('check-links-btn');
    const currentDomainSpan = document.getElementById('current-domain');

    setPopupState(currentDomainSpan);

    checkLinksBtn.addEventListener('click', () => handleScanButtonClick(linksList, checkLinksBtn));

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            checkLinksBtn.click();
        }
    });
});
