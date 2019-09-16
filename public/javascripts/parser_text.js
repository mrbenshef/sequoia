var pt = 
`
// Sequent
SEQ 
  = _ ctx1:CTX_STR _ seq_sign:SeqSign _ ctx2:CTX_STR _{ return "Seq (" + ctx1 + ', Con ("' + seq_sign + '"), ' + ctx2 + ")" }

// Context struct
CTX_STR 
  = ctx:CTX _ ctx_sep:CtxSep _ ctx_str:CTX_STR { return "Mult ( Con (" + ctx_sep + "), " + ctx + ", " + ctx_str + ")" }
  / ctx:CTX { return "Single (" + ctx + ")" } 

// Context
CTX 
  = ctx_lst:CTX_LST { 
    var [ctx_vars, forms] = ctx_lst
    var c = ctx_vars.join(", ")
    var f = forms.join(", ")
    return "Ctx ([" + c + "], [" + f + "])"
  }

CTX_LST
  = ctx_var:CTX_VAR _ "," _ ctx_lst:CTX_LST {
      var [ctx_vars, forms] = ctx_lst
      ctx_vars.push(ctx_var)
      return [ctx_vars, forms]
    }
  / form:FORM _ "," _ ctx_lst:CTX_LST _ { 
      var [ctx_vars, forms] = ctx_lst
      forms.push(form)
      return [ctx_vars, forms]
    }
  / ctx_var:CTX_VAR { return [[ctx_var], []] } 
  / form:FORM { return [[], [form]] } 

// Formula 
FORM = BIFORM / GENFORM  

FORM_LIST 
  = _ form:FORM _ "," _ form_lst:FORM_LIST _ { 
      form_lst.push(form)
      return form_lst 
    }
  / _ form:FORM _ { return [form] }

BIFORM
  = fr:GENFORM _ conn:CONN _ fr2:FORM 
  { return "Form (" + conn + ", [" + fr + "," + fr2 + "])" }

GENFORM
  = "(" _ form:FORM _ ")" { return form }
  / conn:CONN _ form:GENFORM { return "Form (" + conn + ", [" + form + "])" }
  / conn:CONN _ "(" _ fls:FORM_LIST _ ")" {return 'Form(' + conn + ",[" + fls.join(", ") + "])"}
  / form_var:FORM_VAR { return form_var }
  / atom_var:ATOM_VAR { return atom_var }
  / atom:ATOM { return atom }

// Symbols
CONN = conn:Conn { return 'Con ("' + conn  + '")' }
CTX_VAR = ctx_var:CtxVar { return 'CtxVar ("' + ctx_var + '")' }
FORM_VAR = form_var:FormVar { return 'FormVar ("' + form_var + '")' }
ATOM_VAR = atom_var:AtomVar { return 'AtomVar ("' + atom_var + '")' }
ATOM = atom:Atom { return 'Atom ("' + atom + '")' }

_ "whitespace"
  = [ ]*

`