const EX_EMBED_KEY_UNDEFINED = "[Failed to set embedded data. Did you set up the embedded data key in the Survey Flow?]";
const EX_EMBED_VALUE_UNDEFINED = "[Failed to set embedded data. Value is undefined. ]";
const EX_INVALID_QUERY = "[Unable to retrieve survey data. Did you enter a valid syntax for the query?]"

const DOM_BODY_ID = "QuestionBody";

function abort(msg) {
    console.error(msg);
    return -1;
}

function lg(msg) {
    console.log(msg);
}

let q = null;

function isProdEnv() {
    try {
        q = Qualtrics.SurveyEngine; 
    } catch (error) {
        return false;
    }
    return true;
}

function getSurveyData(query) {
    if (query == "")
        return abort(EX_INVALID_QUERY);
    lg("getSurveyData()->" + query);
    return query;
}

function setSurveyData(key, value) {
    if (key == undefined) 
        return abort(EX_EMBED_KEY_UNDEFINED);
    else if (value == undefined)  
        return abort(EX_EMBED_VALUE_UNDEFINED);
    
    if (isProdEnv() == true) {
        Qualtrics.SurveyEngine.setEmbeddedData(key, value);
    }
    lg("setSurveyData()-> {key: " + key + ", value: " + value + "}");
}

class DatePickerProperties {
    key = null 
    minDate = moment("2020-01-01")
    maxDate = moment()
    constructor(options) {
        if (options != null) {
            this.key = options.key;
            if (options.minDate != null)
                this.minDate = options.minDate;
            if (options.maxDate != null)
                this.maxDate = options.maxDate;
        }
    }
}

class MatrixProperties {
    key = null 
    datacol = 0
    datecol = 0
    dropdown_options = ['', 'Low', 'Medium', 'High'];
    
    constructor(options) {
        if (options != null) {
            this.key = options.key;
            if (options.datacol != null)
                this.datacol = options.datacol;
            if (options.dropdown_options != null)
                this.dropdown_options = options.dropdown_options;
            if (options.datecol != null)
                this.datecol = options.datecol;
        }
    }
}

function createDatePicker(options) {
    let body = document.getElementsByClassName(DOM_BODY_ID)[0];
    let props = new DatePickerProperties(options);
    if (body != null) {
        let input = document.createElement("input");
        input.type = "text";
        input.id = "datepicker";
        input.className = "form-control";
        body.appendChild(input);
        var picker = new Pikaday({ 
            field: document.getElementById('datepicker'),
            format: 'YYYY-MM-DD',
            onSelect: function() {
                let data = this.getMoment().format('YYYY-MM-DD');
                console.log(data);
                if (props != null) 
                    if (props.key != null) 
                        setSurveyData(options.key, data);
            }
        });

        minDate = moment("2020-01-01");
        maxDate = moment();
        if (props != null) {
            if (props.minDate != null)
                minDate = moment(options.minDate);
            if (props.maxDate != null)
                maxDate = moment(options.maxDate);
        }

        picker.setMinDate(minDate.toDate());
        picker.setMaxDate(maxDate.toDate());
    }
}

function addMatrixHeaderColumns(matrix, cols) {
    if (matrix != null && cols != null) {
        if (cols.length > 0) {
            let new_row = []
            matrix.unshift(new_row);
            for (var r = 0; r < cols.length; r++) {
                new_row[r] = cols[r];
            }
        }
    }
}

function copyToColumn(matrix, index, cols, start_index = 0) {
    if (matrix != null && start_index >= 0 && cols != null) {
        if (matrix.length > 0 && cols.length > 0) {
            for (var c = 0; c < cols.length && c < matrix.length - start_index; c++) {
                matrix[c + start_index][index] = cols[c];
            }
        }
    }
}

function copyToColumnFromJSONArray(matrix, json, col, row) {
    let str = "";
	
	// [0...NumDays]
	for (var c = 0; c < json.length; c++) {
		// a = []
		// [0] = "Day x"
		// [1] = [["Fever", "High], ["Chills", "High"]]
		let a = json[c];
		if (a.length > 1) {
			let day = a[0];
			let re = /\d+/g;
			let match = day.match(re);
			col = parseInt(match[0]);
			// s = [["Fever", "High], ["Chills", "High"]]
			let s = a[1];
			for (var cy = 0; cy < s.length; cy++) {
				// ["Fever", "High"]
				let b = s[cy];
				for (var rx = 0; rx < b.length; rx++) {
					let data = b[rx];
					str += data;
					if (rx == b.length - 1) {
						str += ".";	
					} else {
						str += "---";	
					}
					str += "\n";
				}
			}
		}
		if (str != "") {
			matrix[col][row] = str;
		}
		str = "";
	}
}

function make1DMatrixFromMoments(start, end) {
    if (start == null || end == null) {
        console.error("Moment object is null. Are your start and end moments set properly?");
        return;
    }

    let matrix = []
    let i = 1;
    for (var m = moment(start); m.isBefore(end); m.add(1, 'days')) {
        matrix.push("Day " + i.toString());
        i++;
    }
    return matrix;
}

function get2DMatrixColumn(matrix, row_index) {
    let result = []
    for (var i = 0; i < matrix.length; i++) {
        result.push(matrix[i][row_index]);
    }
    return result;
}

function make2DMatrixFromMoments(start, end, row_len) {
    if (start == null || end == null) {
        console.error("Moment object is null. Are your start and end moments set properly?");
        return;
    }

    let matrix = [];
    i = 0;
    for (var m = moment(start); m.isBefore(end); m.add(1, 'days')) {
        let m = [];
        for (var i = 0; i < row_len; i++) {
            m.push("");
        }
        matrix.push(m);
    }

    return matrix;
}

function createDropdownMatrix(matrix, id, options) {
    let body = document.getElementsByClassName(DOM_BODY_ID)[0];
    let props = new MatrixProperties(options);
    if (body != null) {
        let div = document.createElement("div");
        div.className = "table-responsive-sm";
        body.appendChild(div);

        let table = document.createElement("table");
        table.className = "table";
        div.appendChild(table);

        let caption = document.createElement("caption");
        caption.innerText = "Matrix";
        table.appendChild(caption);

        let col_len = matrix[0].length;
        let row_len = matrix.length;

        let head = null;
        let trow = null;
        let tbody = null;
        let cur_row = null;

        let queued_data = new Map();
        
        for (var r = 0; r < row_len; r++) {
            for (var c = 0; c < col_len; c++) {
                let data = matrix[r][c];
                if (r == 0) {
                    if (head == null) {
                        head = document.createElement("thead");
                        table.appendChild(head);
                    }
                    if (trow == null) {
                        trow = document.createElement("tr");
                        head.appendChild(trow);
                    }
                    let h = document.createElement("th");
                    h.className = "h6";
                    h.scope = "col";
                    h.innerText = data;
                    trow.appendChild(h);
                } else {
                    if (tbody == null) {
                        tbody = document.createElement("tbody");
                        table.appendChild(tbody);
                    }
                    if (cur_row == null) {
                        cur_row = document.createElement("tr");
                        tbody.appendChild(cur_row);
                    }
                    let td = null;
                    if (r == 0) {
                        td = document.createElement("th");
                        td.scope = "row";
                    } else {
                        td = document.createElement("td");
                    }
                    td.className = "p";
                    td.innerText = data;
                    if (c > props.datacol) {
                        let d_div = document.createElement("div");
                        d_div.className = "dropdown";
                        td.appendChild(d_div);

                        let sel = document.createElement("select");
                        sel.day = matrix[r][props.datecol];
						sel.fieldName = matrix[0][c];
						sel.r = r;
                        sel.c = c;
                        sel.onchange = function() {
                            console.log(sel.day + ": "  + sel.fieldName + ": " + sel.value);
                            if (queued_data.get(sel.day) == null)
                                queued_data.set(sel.day, new Map());
                            m = queued_data.get(sel.day);
                            if (m.get(sel.fieldName) == null)
                                m.set(sel.fieldName, "None");
                            m.set(sel.fieldName, sel.value);
                            if (sel.value == "")
                                m.delete(sel.fieldName);
                            json = JSON.stringify(queued_data, (key, value) => (value instanceof Map ? [...value] : value));
                            if (window.localStorage != null) 
                                window.localStorage[id] = json;
                            
                            if (props != null) {
                                if (props.key != null) {
                                    setSurveyData(props.key, json);
                                }
                            }
                        }
                        sel.className = "custom-select";
                        d_div.appendChild(sel);
                        let dropdown = props.dropdown_options;
                        for (let k = 0; k < dropdown.length; k++) {
                            let o = document.createElement("option");
                            o.value = dropdown[k];
                            o.innerText = dropdown[k];
                            sel.appendChild(o);
                        }
                    }
                    cur_row.appendChild(td);
                }
            }
            cur_row = null;
        } 
    }
}
