let nodes = [];
let selectedNodeId = null;
let dragState = null;
let isPreviewMode = false;

const container = document.getElementById('timeline-container');
const svg = document.getElementById('timeline-svg');
const pathEl = document.getElementById('timeline-path');

function generateId() {
    return 'node-' + Math.random().toString(36).substr(2, 9);
}

function renderNodes() {
    container.innerHTML = '';
    
    // Find bounds to resize SVG and container
    let maxY = 1000;
    
    nodes.forEach(node => {
        if (node.y > maxY - 500) maxY = node.y + 500;
        
        const el = document.createElement('div');
        el.className = 'node' + (node.id === selectedNodeId ? ' selected' : '');
        el.id = node.id;
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        el.dataset.axis = node.axis;
        
        el.innerHTML = `
            <div class="drag-handle"></div>
            <button class="node-delete">&times;</button>
            <div class="node-year" contenteditable="${!isPreviewMode}" data-placeholder="Year">${node.year || ''}</div>
            <div class="node-title" contenteditable="${!isPreviewMode}" data-placeholder="Title">${node.title || ''}</div>
            <div class="node-desc" contenteditable="${!isPreviewMode}" data-placeholder="Description">${node.desc || ''}</div>
        `;
        
        // Event listeners for text edit
        const updateText = (className, key) => {
            const textEl = el.querySelector(className);
            textEl.addEventListener('input', (e) => {
                node[key] = e.target.innerText;
            });
        };
        updateText('.node-year', 'year');
        updateText('.node-title', 'title');
        updateText('.node-desc', 'desc');
        
        // Select node
        el.addEventListener('mousedown', (e) => {
            if (isPreviewMode) return;
            if (e.target.classList.contains('drag-handle') || e.target.classList.contains('node-delete')) return;
            selectedNodeId = node.id;
            renderNodes();
        });
        
        // Delete node
        el.querySelector('.node-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNode(node.id);
        });
        
        // Drag logic
        const handle = el.querySelector('.drag-handle');
        handle.addEventListener('mousedown', (e) => {
            if (isPreviewMode) return;
            e.preventDefault();
            selectedNodeId = node.id;
            dragState = {
                nodeId: node.id,
                startX: e.clientX,
                startY: e.clientY,
                origX: node.x,
                origY: node.y
            };
            renderNodes();
        });
        
        container.appendChild(el);
    });
    
    document.body.style.minHeight = maxY + 'px';
    svg.style.height = maxY + 'px';
    
    renderPath();
}

function deleteNode(id) {
    // Delete node and its children recursively
    const toDelete = [id];
    let i = 0;
    while(i < toDelete.length) {
        const cur = toDelete[i];
        nodes.forEach(n => {
            if (n.parentId === cur) {
                if (!toDelete.includes(n.id)) toDelete.push(n.id);
            }
        });
        i++;
    }
    nodes = nodes.filter(n => !toDelete.includes(n.id));
    if (selectedNodeId === id || toDelete.includes(selectedNodeId)) {
        selectedNodeId = null;
    }
    renderNodes();
}

function renderPath() {
    if (nodes.length === 0) {
        pathEl.setAttribute('d', '');
        return;
    }
    
    let d = '';
    nodes.forEach(node => {
        if (node.parentId) {
            const parent = nodes.find(n => n.id === node.parentId);
            if (parent) {
                // Cubic bezier curve
                const midY = (parent.y + node.y) / 2;
                d += `M ${parent.x} ${parent.y} C ${parent.x} ${midY}, ${node.x} ${midY}, ${node.x} ${node.y} `;
            }
        }
    });
    pathEl.setAttribute('d', d);
}

document.addEventListener('mousemove', (e) => {
    if (!dragState) return;
    const node = nodes.find(n => n.id === dragState.nodeId);
    if (!node) return;
    
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    if (node.axis === 'vertical') {
        node.y = Math.max(50, dragState.origY + dy);
    } else if (node.axis === 'angle') {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
            // Project mouse vector onto angle vector
            const ux = Math.cos(node.angle);
            const uy = Math.sin(node.angle);
            
            const mx = (dragState.origX + dx) - parent.x;
            const my = (dragState.origY + dy) - parent.y;
            
            const dist = mx * ux + my * uy;
            const clampedDist = Math.max(50, dist);
            
            node.x = parent.x + clampedDist * ux;
            node.y = parent.y + clampedDist * uy;
        }
    }
    
    const el = document.getElementById(node.id);
    if (el) {
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
    }
    renderPath();
});

document.addEventListener('mouseup', () => {
    if (dragState) {
        dragState = null;
        renderNodes();
    }
});

document.getElementById('btn-add-node').addEventListener('click', () => {
    let parent = null;
    let x = window.innerWidth / 2;
    let y = 100;
    
    if (selectedNodeId) {
        parent = nodes.find(n => n.id === selectedNodeId);
        if (parent) {
            x = parent.x;
            y = parent.y + 150;
        }
    } else if (nodes.length > 0) {
        parent = nodes[nodes.length - 1];
        x = parent.x;
        y = parent.y + 150;
    }
    
    const newNode = {
        id: generateId(),
        x: x,
        y: y,
        title: '',
        year: '',
        desc: '',
        parentId: parent ? parent.id : null,
        axis: 'vertical',
        angle: 0
    };
    nodes.push(newNode);
    selectedNodeId = newNode.id;
    renderNodes();
});

document.getElementById('btn-add-fork').addEventListener('click', () => {
    if (!selectedNodeId) {
        alert('Please select a node to fork from.');
        return;
    }
    const parent = nodes.find(n => n.id === selectedNodeId);
    if (!parent) return;
    
    const count = parseInt(prompt('How many branches?', '2'));
    if (isNaN(count) || count < 2) return;
    
    // Calculate angles. If count is 2, -45 and 45.
    // If more, distribute evenly between -60 and 60.
    const startAngle = -Math.PI / 4; // -45 deg
    const endAngle = Math.PI / 4;    // 45 deg
    
    for (let i = 0; i < count; i++) {
        let angle = 0;
        if (count === 1) angle = 0;
        else angle = startAngle + (endAngle - startAngle) * (i / (count - 1));
        
        // Because y goes down, angle 0 is +x, angle 90 is +y. 
        // We want the primary direction to be down (which is 90 deg / PI/2).
        // So offset angle by PI/2.
        const actualAngle = Math.PI/2 + angle;
        
        const dist = 150;
        const x = parent.x + dist * Math.cos(actualAngle);
        const y = parent.y + dist * Math.sin(actualAngle);
        
        const newNode = {
            id: generateId(),
            x: x,
            y: y,
            title: '',
            year: '',
            desc: '',
            parentId: parent.id,
            axis: 'angle',
            angle: actualAngle
        };
        nodes.push(newNode);
    }
    renderNodes();
});

document.getElementById('btn-save-json').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "timeline.json");
    dlAnchorElem.click();
});

document.getElementById('btn-load-json').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            nodes = JSON.parse(e.target.result);
            selectedNodeId = null;
            renderNodes();
        } catch(err) {
            alert('Invalid JSON file');
        }
    };
    reader.readAsText(file);
});

document.getElementById('btn-export-html').addEventListener('click', () => {
    const htmlClone = document.documentElement.cloneNode(true);
    
    // Remove the toolbar
    const tb = htmlClone.querySelector('#toolbar');
    if (tb) tb.remove();
    
    // Remove scripts and link tags
    htmlClone.querySelectorAll('script').forEach(s => s.remove());
    htmlClone.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
        if (l.href.includes('timeline.css')) l.remove();
    });
    
    // Fetch CSS and JS to inline them
    Promise.all([
        fetch('timeline.css').then(r => r.text()),
        fetch('timeline.js').then(r => r.text())
    ]).then(([cssText, jsText]) => {
        const style = document.createElement('style');
        style.textContent = cssText;
        htmlClone.querySelector('head').appendChild(style);
        
        const script = document.createElement('script');
        // Simple trick to auto-start in preview mode in the exported file
        script.textContent = jsText + '\n\n' + 'setTimeout(() => { if(document.getElementById("btn-preview")) { isPreviewMode = false; document.getElementById("btn-preview").click(); } else { document.body.classList.add("preview-mode"); isPreviewMode = true; setupPreviewScroll(); renderNodes(); } }, 100);';
        htmlClone.querySelector('body').appendChild(script);
        
        // Hardcode body class
        htmlClone.querySelector('body').classList.add('preview-mode');
        
        const blob = new Blob(["<!DOCTYPE html>\n" + htmlClone.outerHTML], {type: "text/html"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "timeline_export.html";
        a.click();
        URL.revokeObjectURL(url);
    });
});

let scrollListener = null;

function setupPreviewScroll() {
    if (scrollListener) {
        window.removeEventListener('scroll', scrollListener);
    }
    
    // Setup initial dash array to hide the path
    const length = pathEl.getTotalLength() || 10000;
    pathEl.style.strokeDasharray = length;
    pathEl.style.strokeDashoffset = length;
    
    scrollListener = () => {
        if (!isPreviewMode) return;
        
        // Calculate scroll percentage
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = scrollHeight > 0 ? (window.scrollY / scrollHeight) : 0;
        
        // Draw path
        const drawLength = length * scrollPercent;
        pathEl.style.strokeDashoffset = length - drawLength;
        
        // Shift background color
        // Start: #0f172a (15, 23, 42)
        // End: #1e1b4b (30, 27, 75)
        const r = Math.floor(15 + (30 - 15) * scrollPercent);
        const g = Math.floor(23 + (27 - 23) * scrollPercent);
        const b = Math.floor(42 + (75 - 42) * scrollPercent);
        document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    };
    
    window.addEventListener('scroll', scrollListener);
    scrollListener(); // trigger once
}

document.getElementById('btn-preview').addEventListener('click', () => {
    isPreviewMode = !isPreviewMode;
    if (isPreviewMode) {
        document.body.classList.add('preview-mode');
        document.getElementById('btn-preview').innerText = 'Exit Preview';
        
        // Clear selections
        selectedNodeId = null;
        renderNodes();
        
        setupPreviewScroll();
        
    } else {
        document.body.classList.remove('preview-mode');
        document.getElementById('btn-preview').innerText = 'Preview';
        
        if (scrollListener) {
            window.removeEventListener('scroll', scrollListener);
        }
        pathEl.style.strokeDasharray = 'none';
        pathEl.style.strokeDashoffset = '0';
        document.body.style.backgroundColor = '';
        renderNodes();
    }
});

// Initial add
if (nodes.length === 0) {
    document.getElementById('btn-add-node').click();
} else {
    renderNodes();
}
