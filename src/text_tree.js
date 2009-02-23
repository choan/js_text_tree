var TextTree = function() {
  
  var extend = function(superc, proto) {
    var F = function() {};
    F.prototype = superc.prototype;
    var subc = function() {
      if ('initialize' in this) this.initialize.apply(this, arguments);
      else this.constructor.superc.initialize.apply(this, arguments);
    };
    subc.prototype = new F();
    subc.prototype.constructor = subc;
    subc.superc = superc;
    for (var i in proto) {
      subc.prototype[i] = proto[i];
    }
    return subc;
  };
  
  /**
   * Creates a tree object. Should no be used directly, use Tree.parse instead
   * @constructor
   */  
  var Tree = function() {
    this.root = new RootNode('', -1, 0);
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
  Tree.parse = function(input, transformer) {
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
    return tree.root;
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
    }
  };
  
  /**
   * Default node type object
   * @constructor
   */  
  var Node = Tree.Node = extend(Object, 
    {
    initialize :   function(text, tabs, lineNumber) {
        this.text = text;
        this.tabs = tabs;
        this.lineNumber = lineNumber;
        this._children = [];
      },
    /**
     * Adds a child to the node
     */  
    addChild : function(item) {
      this._children.push(item);
      item.parent = this;
    },
    /**
     * Returns node content as a string
     */  
    toString : function(opts) {
      function line(node) {
        var i;
        for (i = 0; i < node.tabs; i += 1) {
          o += '  ';
        }
        o += node.text;
        o += '\n';        
        return o;
      }
      
      var o = '';
      o += line(this);
      this.eachChild(function(node) {
        o += node.toString();
      });
      return o;
    },
    eachChild : function(openCallback, closeCallback, recurse, context) {
      var finalReceiver;
      var count = this.size(), cur;
      for (var i = 0; i < count; i += 1) {
        cur = this.child(i);
        finalReceiver = context || cur;
        openCallback.call(finalReceiver, cur);
        if (recurse) {
          cur.eachChild.apply(cur, arguments);
        }
        if (closeCallback) {
          closeCallback.call(finalReceiver, cur);
        }
      }
      return this;
    },
    /**
      * Returns a child by index
      */
    child : function(index) {
      return this._children[index];
    },
    size : function() {
      return this._children.length;
    }
  });

  /**
    * @constructor
    */
  var RootNode = extend(Node, {
    type: 'root',
    toString : function() {
      var o = '';
      this.eachChild(function(node) {
        o += node.toString();
      });
      return o;
    }
  });

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