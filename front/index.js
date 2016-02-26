import React from 'react';
import ReactDOM from 'react-dom';
import escape from 'sql-escape';
import moment from 'moment';

function formatField(value, name, collector){
	const type = collector.fields[name];
	switch(type){
		case "string": 
			return `"${value}"`;
		case "date":
			return `"${moment(value).toISOString()}"`;
		case "number":
			return value;
	}
}

const collectors = {
	'simple': {
		collect(data){
			if(!data || !data.children){
				return [];
			}
			const result = data.children.map(c=>c.data);
			const sort = model.filters.sort;
			
			result.sort((a,b)=>{
				const _a = a[sort],
					  _b = b[sort];

				const cmp = _a >_b ? 1: (a==b? 0: -1);

				if(model.filters.order == 'asc'){
					return cmp;
				} else {
					return -cmp;
				}

			});
			return result;

		},
		fields: {
			id: "string",
			title: "string",
			created_utc: "date",
			score: "number"
		}
	},
	'aggregate': {
		collect(data){
			if(!data || !data.children){
				return [];
			}
			const rows  = data.children.map(r=>r.data);
			//map
			const mapByDomain = rows.reduce((memo,row)=>{
				memo[row.domain] = (memo[row.domain] || []).concat({score: row.score});
				return memo;
			},{});

			//reduce
			const results =  Object.keys(mapByDomain).map(domain=>{
				const val = mapByDomain[domain];	
				return {
					domain,
					count: val.length,
					score: val.reduce((sum,{score})=>sum+score, 0)
				}
			})
			results.sort((a,b)=>b.count-a.count);
			return results;
		},
		fields: {
			domain: "string",
			count: "number",
			score: "number"
		}

	}
}

const formatters = {
	CSV: function(data, collector){
		return data.map(row=>{
			return Object.keys(collector.fields).map(f=>formatField(row[f], f, collector)).join(',');
		}).join('\n');
	},
	
	SQL: function(data, collector){
		return data.map(row=>{
			const sqlRow = Object.keys(collector.fields).map(f=>formatField(row[f], f, collector)).join(',');
			return `INSERT INTO ${model.filters.table_name} (${Object.keys(collector.fields).map(key=>escape(model.filters.column_name[key]||key.toUpperCase())).join(', ')})`
			 	+ ` VALUES (${sqlRow});`
		}).join('\n');
	}
}

//-- Model --


const model = {
	data: null,
	filters: {
		collector: 'simple',
		format: 'CSV',
		sort: 'created_utc',
		order: 'desc',
		table_name: 'DATA',
		column_name: {
			id: 'ID',
			title: 'TITLE',
			created_utc: 'CREATED',
			score: 'SCORE'
		}
	},
	loading: false
}


// -- Actions --

function changeFilters(diff){
	model.filters = {...model.filters, ...diff};
	render();
}

function changeColumnName(diff){
	changeFilters({column_name: {...model.filters.column_name, ...diff}});
}

// -- View --



function formatData(){
	if(!model.data){
		return 'Loading...';
	}
	const {filters} = model;
	const collector = collectors[filters.collector];
	const formatter = formatters[filters.format];

	const data = collector.collect(model.data);
	
	return formatter(data, collector);
}


class DataPage extends React.Component{
	render(){
		const format = model.filters.format;
		return <div >
			<h3 style={{marginBottom: '1.5em'}}>Система обработки данных JSON Reddit</h3>
			<div id='filters'>
				<div className='form-group'>
					<label>Коллектор</label>
					<select className='form-control' value={model.filters.collector} onChange={e=>changeFilters({collector: e.target.value})}>
						<option value="simple">Простой</option>
						<option value="aggregate">Аггрегирующий</option>
					</select>
				</div>
				<div className='form-group'>
					<label>Формат</label>
					<select className='form-control' value={model.filters.format} onChange={e=>changeFilters({format: e.target.value})}>
						<option>CSV</option>
						<option>SQL</option>
					</select>
				</div>
				{model.filters.collector=='simple' && <div className='row'>
					<div className='form-group col-sm-6'>
						<label>Сортировка</label>
						<select className='form-control' value={model.filters.sort} onChange={e=>changeFilters({sort: e.target.value})}>
							<option value='created_utc'>Дата создания</option>
							<option value='score'>Баллы</option>
						</select>			
					</div>
					<div className='form-group col-sm-6'>
						<label>Порядок</label>
						<select className='form-control' value={model.filters.order} onChange={e=>changeFilters({order: e.target.value})}>
							<option value='asc'>По возрастанию</option>
							<option value='desc'>По убыванию</option>
						</select>
					</div>
				</div>}
				{format == 'SQL' && <div>
					<div className='row'>

						<div className='form-group col-sm-6'>
							<label>Название таблицы</label>
							<input className='form-control' value={model.filters.table_name} onChange={e=>changeFilters({table_name: e.target.value})}/>
						</div>
					</div>

					<div className='row'>
					{Object.keys(collectors[model.filters.collector].fields).map(key=>(
						<div className='form-group col-sm-6'>
							<label>Поле для колонки {key}</label>
							<input className='form-control' value={model.filters.column_name[key]||key.toUpperCase()} onChange={e=>changeColumnName({[key]: e.target.value})}/>
						</div>
					))}
					</div>
				</div>}
			</div>
			<div className='form-group'>
				<label>Результат</label>
				<textarea readOnly={true} className='form-control' ref='ta' onClick={e=>this.refs.ta.select()} rows={20} cols={100} value={formatData()}>
				</textarea>
			</div>
		</div>
	}
}



window.onload =  ()=>{
	fetch('/json').then(function(resp){
		return resp.json()
	}).then(function(json){
		model.data = json.data;
		render();
	})
	render();

}

function render(){
	ReactDOM.render(<DataPage/>, document.getElementById('content'));
}


