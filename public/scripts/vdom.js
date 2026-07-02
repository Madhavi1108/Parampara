/**
 * Advanced Lightweight Virtual DOM Engine
 * Supports Functional Components, Keyed Reconciliation, Batched Updates, and robust Event Management.
 */

const TEXT_ELEMENT = "TEXT_ELEMENT";

// 1. h() - Virtual DOM node creator
function h(type, props, ...children) {
  props = props || {};
  let key = props.key || null;
  if ('key' in props) delete props.key;

  return {
    type,
    props: {
      ...props,
      children: children.flat().filter(child => child != null && child !== false).map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
    key,
  };
}

function createTextElement(text) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: String(text),
      children: [],
    },
    key: null,
  };
}

// 2. render() - Convert VNode to real DOM
function render(vNode) {
  if (typeof vNode.type === 'function') {
    return render(vNode.type(vNode.props));
  }

  const dom =
    vNode.type === TEXT_ELEMENT
      ? document.createTextNode(vNode.props.nodeValue)
      : document.createElement(vNode.type);

  updateDomProperties(dom, {}, vNode.props);

  vNode.props.children.forEach(child => {
    dom.appendChild(render(child));
  });

  dom.__vNode = vNode; // Save reference for diffing
  return dom;
}

// 3. updateDomProperties() - Handle attributes and event listeners
const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

function updateDomProperties(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      if (name in dom) {
        dom[name] = "";
      } else {
        dom.removeAttribute(name);
      }
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      if (name in dom && name !== 'class' && name !== 'list') { // list is read-only
        dom[name] = nextProps[name];
      } else {
        // SVG/custom attrs or standard attrs
        if (name === 'className') dom.setAttribute('class', nextProps[name]);
        else dom.setAttribute(name, nextProps[name]);
      }
    });

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

// 4. diff() - Diffing two vNodes
function diff(dom, oldVNode, newVNode) {
  // If oldVNode is a functional component, extract its rendered output
  let oldRendered = oldVNode;
  if (typeof oldVNode?.type === 'function') {
      oldRendered = dom.__vNode; // approximate, not perfect state management
  }

  let newRendered = newVNode;
  if (typeof newVNode?.type === 'function') {
      newRendered = newVNode.type(newVNode.props);
  }

  if (!newRendered) {
    dom.remove();
    return null;
  }

  if (oldRendered.type !== newRendered.type) {
    const newDom = render(newRendered);
    dom.replaceWith(newDom);
    return newDom;
  }

  if (oldRendered.type === TEXT_ELEMENT) {
    if (oldRendered.props.nodeValue !== newRendered.props.nodeValue) {
      dom.nodeValue = newRendered.props.nodeValue;
    }
  } else {
    updateDomProperties(dom, oldRendered.props, newRendered.props);
    diffChildren(dom, oldRendered.props.children, newRendered.props.children);
  }

  dom.__vNode = newRendered;
  return dom;
}

// 5. diffChildren() - Keyed reconciliation algorithm
function diffChildren(parentDom, oldChildren, newChildren) {
  const domChildren = Array.from(parentDom.childNodes);
  const oldChildrenByKey = {};
  const oldChildrenByIndex = [];

  // Build maps of old children
  oldChildren.forEach((child, i) => {
    if (child.key != null) {
      oldChildrenByKey[child.key] = { vNode: child, dom: domChildren[i] };
    } else {
      oldChildrenByIndex.push({ vNode: child, dom: domChildren[i] });
    }
  });

  // Diff or create new children
  let lastPlacedIndex = 0;
  
  newChildren.forEach((newChild, i) => {
    let oldMatch;
    
    // 1. Try to match by key
    if (newChild.key != null && oldChildrenByKey[newChild.key]) {
      oldMatch = oldChildrenByKey[newChild.key];
      delete oldChildrenByKey[newChild.key];
    } 
    // 2. Try to match unkeyed by index/type
    else if (oldChildrenByIndex.length > 0) {
        for(let j=0; j<oldChildrenByIndex.length; j++) {
            if (oldChildrenByIndex[j].vNode.type === (typeof newChild.type === 'function' ? newChild.type.name : newChild.type)) {
                oldMatch = oldChildrenByIndex.splice(j, 1)[0];
                break;
            }
        }
        if (!oldMatch) {
            oldMatch = oldChildrenByIndex.shift(); // fallback to first unkeyed
        }
    }

    if (oldMatch) {
      // Node existed, diff it
      const patchedDom = diff(oldMatch.dom, oldMatch.vNode, newChild);
      
      // Move it if it's not in the right place
      if (parentDom.childNodes[i] !== patchedDom) {
        parentDom.insertBefore(patchedDom, parentDom.childNodes[i]);
      }
    } else {
      // Node is new, render and insert
      const newDom = render(newChild);
      if (parentDom.childNodes[i]) {
        parentDom.insertBefore(newDom, parentDom.childNodes[i]);
      } else {
        parentDom.appendChild(newDom);
      }
    }
  });

  // Remove any remaining old children
  Object.values(oldChildrenByKey).forEach(({ dom }) => dom.remove());
  oldChildrenByIndex.forEach(({ dom }) => dom.remove());
}

// 6. Scheduling / Batching
let updateQueue = [];
let isUpdateScheduled = false;

function scheduleUpdate(updateFn) {
  updateQueue.push(updateFn);
  if (!isUpdateScheduled) {
    isUpdateScheduled = true;
    requestAnimationFrame(processUpdates);
  }
}

function processUpdates() {
  const queue = updateQueue;
  updateQueue = [];
  isUpdateScheduled = false;

  queue.forEach(updateFn => updateFn());
}

window.vdom = { h, render, diff, scheduleUpdate };
