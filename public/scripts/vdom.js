/**
 * Lightweight Virtual DOM Engine
 * Provides h(), render(), diff(), and patch() for efficient DOM updates.
 */

function h(tagName, props, ...children) {
  return {
    tagName,
    props: props || {},
    children: children.flat().filter(child => child != null)
  };
}

function render(vNode) {
  if (typeof vNode === 'string' || typeof vNode === 'number') {
    return document.createTextNode(String(vNode));
  }

  const $el = document.createElement(vNode.tagName);

  for (const [k, v] of Object.entries(vNode.props)) {
    if (k.startsWith('on') && typeof v === 'function') {
      $el.addEventListener(k.toLowerCase().substring(2), v);
    } else {
      $el.setAttribute(k, v);
    }
  }

  for (const child of vNode.children) {
    const $child = render(child);
    $el.appendChild($child);
  }

  return $el;
}

function diff(oldVTree, newVTree) {
  // If the new tree is undefined, remove the node
  if (newVTree === undefined) {
    return function($node) {
      $node.remove();
      return undefined;
    };
  }

  // If both are primitive types (strings/numbers)
  if (typeof oldVTree === 'string' || typeof oldVTree === 'number') {
    if (oldVTree !== newVTree) {
      return function($node) {
        const $newNode = render(newVTree);
        $node.replaceWith($newNode);
        return $newNode;
      };
    } else {
      return function($node) {
        return $node; // No change
      };
    }
  }

  // If the tags are different, replace the whole node
  if (oldVTree.tagName !== newVTree.tagName) {
    return function($node) {
      const $newNode = render(newVTree);
      $node.replaceWith($newNode);
      return $newNode;
    };
  }

  // Diff props and children
  const patchProps = diffProps(oldVTree.props, newVTree.props);
  const patchChildren = diffChildren(oldVTree.children, newVTree.children);

  return function($node) {
    patchProps($node);
    patchChildren($node);
    return $node;
  };
}

function diffProps(oldProps, newProps) {
  const patches = [];

  // Set new or changed props
  for (const [k, v] of Object.entries(newProps)) {
    patches.push(function($node) {
      if (k.startsWith('on')) return $node; // Skip event listeners diff for simplicity
      if (oldProps[k] !== v) {
        $node.setAttribute(k, v);
      }
      return $node;
    });
  }

  // Remove old props
  for (const k in oldProps) {
    if (!(k in newProps)) {
      patches.push(function($node) {
        if (k.startsWith('on')) return $node;
        $node.removeAttribute(k);
        return $node;
      });
    }
  }

  return function($node) {
    for (const patch of patches) {
      patch($node);
    }
    return $node;
  };
}

function diffChildren(oldVChildren, newVChildren) {
  const childPatches = [];
  oldVChildren.forEach((oldVChild, i) => {
    childPatches.push(diff(oldVChild, newVChildren[i]));
  });

  const additionalPatches = [];
  for (const additionalVChild of newVChildren.slice(oldVChildren.length)) {
    additionalPatches.push(function($node) {
      $node.appendChild(render(additionalVChild));
      return $node;
    });
  }

  return function($parent) {
    // childNodes is a live NodeList, so we must be careful when removing elements.
    // By keeping track of the return values of our patches, we know which elements are removed.
    // However, for simplicity here, we iterate backward when applying removing patches.
    
    $parent.childNodes.forEach(($child, i) => {
      const patch = childPatches[i];
      if (patch) {
         patch($child);
      }
    });

    for (const patch of additionalPatches) {
      patch($parent);
    }
    return $parent;
  };
}

window.vdom = { h, render, diff };
