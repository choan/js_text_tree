var TextTree = function() {
  
  /**
   * Creates a tree object. Should no be used directly, use Tree.parseInput instead
   * @constructor
   */  
  var Tree = function() {
    this.root = new Node('', -1, 0);
    this.stack = [ this.root ];
  };

  var defaultTransformer = function(text, tabCount, lineNumber) {
    return new Node(text, tabCount, lineNumber);
  };

  /**
   * Takes a string as input and returns a tree object
   * Each line in input is converted to a node, whitespace
   * at the start of a line specifies nesting
   * A transformer function may be passed, to create custom node-like objects
   * @return {Tree}
   */ 
  Tree.parseInput = function(input, transformer) {
    var tabStr, tabSize = null, line, tabCount, i, j, item;
    var tree = new Tree();
    if (!transformer) transformer = defaultTransformer;
    var a = input.split(/\r|\n|\r\n/);
    for (i = 0, j = 1; i < a.length; i += 1, j += 1) {
      line = a[i];
      if (line.search(/^\s*$/) != -1) continue;
      tabStr = line.match(/^\s*/);
      tabStr = tabStr && tabStr[0];
      if (tabStr.length > 0 && tabSize === null) {
        tabSize = tabStr.length;
      }
      tabCount = tabSize ? tabStr.length / tabSize : 0;
      if (parseInt(tabCount, 10) != tabCount) throw Tree.exception.SyntaxError("Invalid nesting on line " + j);
      item = transformer(line.substring(tabStr.length), tabCount, j);
      if (item) tree.pushNode(item);
    }
    return tree;
  };

  Tree.prototype = {
    /**
     * Adds a node to the tree
     * Uses last node as parent if indentation matches, otherwise
     * pops the open stack as needed
     */  
    pushNode : function(item) {
      var lastInStack = this.stack[this.stack.length - 1];
      if (item.tabs != lastInStack.tabs + 1 ) {
        while (lastInStack.tabs >= item.tabs) {
          this.stack.pop();
          lastInStack = this.stack[this.stack.length - 1];
        }
      }
      lastInStack.addChild(item);
      this.stack.push(item);
      item.tree = this;
      return this;
    },
    /**
     * Returns the tree content as a string
     */  
    dump : function(opts) {
      return this.root.dumpChildren(opts);
    }
  };
  
  /**
   * Default node type object
   * @constructor
   */  
  var Node = Tree.Node = function(text, tabs, lineNumber) {
    this.text = text;
    this.tabs = tabs;
    this.lineNumber = lineNumber;
    this.children = [];
  };

  Node.prototype = {
    /**
     * Adds a child to the node
     */  
    addChild : function(item) {
      this.children.push(item);
      item.parent = this;
    },
    /**
     * Returns node content as a string
     */  
    dump : function(opts) {
      var i, o = '';
      for (i = 0; i < this.tabs; i += 1) {
        o += '  ';
      }
      o += this.text;
      o += '\n';
      o += this.dumpChildren(opts);
      return o;
    },
    /**
     * Returns node's children content as a string
     */  
    dumpChildren : function(opts) {
      var o = '', i;
      for (i = 0; i < this.children.length; i += 1) {
        o += this.children[i].dump(opts);
      }
      return o;
    }
  };

  Tree.exception = {
    /**
     * Creates new exception types
     */  
    exceptionType : function(name) {
      Tree.exception[name] = function(m) {
        return { name: name, message : m };
      };
    }
  };

  Tree.exception.exceptionType('SyntaxError');

  return Tree;
  
}();