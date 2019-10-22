
structure Equivalence  : EQUIVALENCE = 
struct
	structure Set = SplaySetFn(StringKey);
	(*constraint form: String*ctx_var list*ctx_var list *)
	structure Dat = datatypesImpl
	structure H = helpersImpl
	structure C = Check




	(*given 2 sequents, check if they are equivalent*)
	fun ctx_struct_equiv (Dat.Empty,Dat.Empty):bool = true
		|ctx_struct_equiv (Dat.Single (ctxA),Dat.Single(ctxB)) = ctx_equiv(ctxA,ctxB)
		|ctx_struct_equiv (Dat.Mult (connA,ctxA,ctx_struct_A),Dat.Mult (connB,ctxB,ctx_struct_B)) = Dat.conn_eq(connA,connB) 
																							andalso ctx_equiv(ctxA,ctxB)
																							andalso ctx_struct_equiv(ctx_struct_A,ctx_struct_B)
		|ctx_struct_equiv (_,_) = false
	and ctx_equiv(Dat.Ctx(ctx_vars_A,forms_A),Dat.Ctx(ctx_vars_B,forms_B)) = ctx_vars_equiv(ctx_vars_A,ctx_vars_B)
																			andalso forms_eq(forms_A,forms_B)
	and forms_eq (forms_A, forms_B) = H.mset_eq(forms_B,forms_A,Dat.form_eq)
	and ctx_vars_equiv (_,_) = true

	fun seq_equiv (Dat.Seq(A1,con1,A2),Dat.Seq(B1,con2,B2)) = ctx_struct_equiv(A1,B1) andalso Dat.conn_eq(con1,con2) andalso ctx_struct_equiv(A2,B2)


	fun ctx_equiv_wk (ctxA as Dat.Ctx(_,formsA),ctxB as Dat.Ctx(_,formsB),wk)=
		case (wk) of
			(true) => H.mset_subset(formsA,formsB,Dat.form_eq)
			| (false) => H.mset_eq(formsA,formsB,Dat.form_eq)
			

	fun ctx_struct_equiv_wk (Dat.Empty,Dat.Empty,_) =true
		|ctx_struct_equiv_wk (Dat.Single(ctxA),Dat.Single(ctxB),wk) = 
			(case wk of
			   [] => ctx_equiv_wk(ctxA,ctxB,false)
			 |  x::_ => ctx_equiv_wk(ctxA,ctxB,x))
		|ctx_struct_equiv_wk (Dat.Mult(connA,ctxA,ctx_structA),Dat.Mult(connB,ctxB,ctx_structB),wk)=
		(case Dat.conn_eq(connA,connB) of
		   false => false
		 | true => (case wk of
					  [] => ctx_equiv_wk(ctxA,ctxB,false) andalso ctx_struct_equiv_wk(ctx_structA,ctx_structB,[])
		  			| x::l => ctx_equiv_wk(ctxA,ctxB,x) andalso ctx_struct_equiv_wk(ctx_structA,ctx_structB,l)))
		|ctx_struct_equiv_wk (_,_,_) = false 

	fun seq_equiv_wk (Dat.Seq (leftA,connA,rightA),Dat.Seq(leftB,connB,rightB),(wk_l: bool list , wk_r:bool list))=
		Dat.conn_eq(connA,connB) andalso (ctx_struct_equiv_wk(leftA,leftB,wk_l)) andalso ctx_struct_equiv_wk(rightA,rightB,wk_r)
	 

	(*taken from: https://stackoverflow.com/questions/33597175/how-to-write-to-a-file-in-sml*)
	fun writeFile filename content =
	    let val fd = TextIO.openOut filename
	        val _ = TextIO.output (fd, content) handle e => (TextIO.closeOut fd; raise e)
	        val _ = TextIO.closeOut fd
	    in () end

	fun list_to_vector ([],[]) = []
		|list_to_vector (x,[]) = raise Fail ("there might be undefined vars\n"^Dat.ctx_varL_toString(x))
		|list_to_vector (L,v::rest) = 
		let
			val (L_v,L_rest) = List.partition (fn x => Dat.ctx_var_eq(x,v)) L
			val v_num = List.length(L_v)
		in
			v_num::(list_to_vector(L_rest,rest))
		end

	fun constraint_to_row (cons as (_,left,right), var_list) = 
		let
			val left_v = list_to_vector(left,var_list)
			val right_v = list_to_vector(right,var_list)
		in
			ListPair.mapEq (fn (x,y) => x-y) (left_v,right_v)
		end

	fun row_list_to_string ([]) = "\n"
		|row_list_to_string ([x])=  x^"\n"
		|row_list_to_string (x::L) = x^" "^row_list_to_string(L)

	fun myIntToString (x) = case x>=0 of
		true => Int.toString(x)
		| false => "-"^Int.toString(x * ~1)

	fun cons_to_matrix ([],_) = "\n"
		|cons_to_matrix (x::L,var_list) =
		let
			val rest = cons_to_matrix (L,var_list)
			val row_list = constraint_to_row (x,var_list)
			val row = row_list_to_string (List.map myIntToString row_list)
		in
			row^rest
		end

	(*goal has atleast one constraint*)
	fun check_consistent (constraints,t1_vars,t2_vars) =
		let
			val new_cons = constraints
			val cons_len = List.length(new_cons)
			val t1_var_num = List.length(t1_vars)
			val var_num = t1_var_num + List.length(t2_vars)
			val vars_list = t1_vars @ t2_vars
			val line1 = Int.toString(cons_len)^" "^Int.toString(var_num)^" "^Int.toString(t1_var_num)^"\n"
			val matrix = cons_to_matrix (new_cons,vars_list)
			val line2 = row_list_to_string(List.map (fn Dat.CtxVar(x) => x) vars_list)
			val _ = writeFile "check" (line1^line2^matrix)
			val result = C.main_check("check")
			val _ = OS.FileSys.remove("check")
		in
			result
		end

	
  
	(* TODO:  a not empty*)
	fun extract_constraints'' (Dat.Ctx (a,_), Dat.Ctx (b,_),wk) = 
		(case (wk,a) of
		   (true,[]) => (Dat.CtxVar("eq"),b,b)
		 | _ => (Dat.CtxVar("eq"),a,b))

	fun extract_constraints' (Dat.Empty,Dat.Empty,_) = []
		| extract_constraints' (Dat.Single a, Dat.Single b,wk) = 
			(case wk of
			   [] => [extract_constraints'' (a,b,false)]
			 | x::_ => [extract_constraints'' (a,b,x)])
		| extract_constraints' (Dat.Mult(_,a,A),Dat.Mult(_,b,B),wk) = 
			(case wk of
			   [] => extract_constraints''(a,b,false)::extract_constraints'(A,B,[])
			 | x::l => extract_constraints''(a,b,x)::extract_constraints'(A,B,l))
    | extract_constraints' (_,_,_) = raise Fail "Ctx_structs don't match"

	fun extract_constraints_wk (Dat.Seq(L1,_,R1),Dat.Seq(L2,_,R2),(wk_l,wk_r)) = extract_constraints'(L1,L2,wk_l) @ extract_constraints' (R1,R2,wk_r) 

	fun extract_constraints (A,B) = extract_constraints_wk(A,B,([],[]))


	(*check premises with an extra term that can be weakened*)
	fun check_premises_wk (_,[],constraints,_,t1_vars,t2_vars) = check_consistent(constraints,t1_vars,t2_vars)
		|check_premises_wk (assumed_leaves,x::conc_leaves,cons,weak,t1_vars,t2_vars) = 
		let
			val possible_premises = List.filter (fn y => seq_equiv_wk (y,x,weak)) assumed_leaves
			fun find_match [] = false
				| find_match (y::L) = 
				let
					val new_cons = extract_constraints_wk (y,x,weak) @ cons
				in
					check_premises_wk (assumed_leaves,conc_leaves,new_cons,weak,t1_vars,t2_vars) orelse
					find_match L
				end
		in
			find_match possible_premises
		end

	fun check_premises (_,[],constraints,t1_vars,t2_vars) = check_consistent(constraints,t1_vars,t2_vars)
		| check_premises (assumed_leaves,x::conc_leaves,cons,t1_vars,t2_vars) = 
		let
			val possible_premises = List.filter (fn y => seq_equiv (y,x)) assumed_leaves
			fun find_match [] = false
				| find_match (y::L) = 
				let
					val new_cons = extract_constraints (y,x) @ cons
				in
					check_premises (assumed_leaves,conc_leaves,new_cons,t1_vars,t2_vars) orelse
					find_match L
				end
		in
			find_match possible_premises
		end


	

	
	(* Body *)
end

