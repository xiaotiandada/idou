/*
 * @Author: chengtianqing
 * @Date: 2021-06-12 16:43:10
 * @LastEditTime: 2021-06-14 04:35:28
 * @LastEditors: chengtianqing
 * @Description: 转换api数据，映射对应的编辑内容
 */
const isObject = require('lodash/isObject');
const get = require('lodash/get');

const apiData = {
  title: '商品列表',
  method: 'POST',
  url: '/cross/mhk/pageList',
  request: {
    applicationNo: { type: 'string', description: '预约单号', mock: [Object] },
    status: { type: 'string', description: '预约单状态', mock: [Object] },
    warehouseCode: { type: 'string', description: '收货地址', mock: [Object] },
    createTimeStart: {
      type: 'string',
      description: '创建时间-查询起始时间',
      mock: [Object],
    },
    createTimeEnd: {
      type: 'string',
      description: '创建时间-查询结束时间',
      mock: [Object],
    },
    appointTimeStart: {
      type: 'string',
      description: '预约到货时间-查询起始时间',
      mock: [Object],
    },
    appointTimeEnd: {
      type: 'string',
      description: '预约到货时间-查询结束时间',
      mock: [Object],
    },
    userId: { type: 'number', description: '用户ID', mock: [Object] },
    page: { type: 'number', description: '分页参数-第几页', mock: [Object] },
    pageSize: { type: 'number', description: '分页参数-页数', mock: [Object] },
  },
  response: {
    pageNum: { type: 'number', description: '当前页', mock: [Object] },
    pageSize: { type: 'number', description: '分页大小', mock: [Object] },
    total: { type: 'number', description: '总元素数', mock: [Object] },
    pages: { type: 'number', description: '总页数', mock: [Object] },
    contents: {
      type: 'array',
      description: '数据 ,T',
      items: {
        properties: {
          applicationNo: {
            type: 'string',
            description: '预约单号',
            mock: [Object],
          },
          status: { type: 'string', description: '预约单状态', mock: [Object] },
          avgPrice: {
            type: 'string',
            description: '均价',
            mock: [Object],
          },
          appointTime: {
            type: 'string',
            description: '预约到货时间',
            mock: [Object],
          },
        },
      },
    },
    extra: {
      type: 'object',
      description: '附加信息(该参数为map)',
      properties: [Object],
    },
  },
};

/**
 * 转换data
 * @param {*} apiData
 * @returns
 */
function transData(apiData) {
  if (isObject(apiData)) {
    const { request, response, title } = apiData;
    // 先根据response结构判断页面类型
    if (isObject(response)) {
      // 判断是否为列表类型页面
      if (
        response.total ||
        (response.contents && response.contents.type === 'array') ||
        (response.list && response.list.type === 'array') ||
        (response.rows && response.rows.type === 'array') ||
        (title && title.indexOf('列表') > -1)
      ) {
        apiData.componentType = 'list';
      } else {
        apiData.componentType = 'modal';
      }
    }
    // 再根据页面类型进行数据处理
    if (apiData.componentType === 'list') {
      // 列表类型
      // 转换搜索组件数据类型
      if (isObject(request)) {
        const form = {};
        const search = {
          form: {},
          pageKey: '',
          pageSizeKey: '',
        };
        Object.entries(request).forEach(([k, v]) => {
          if (['page', 'pageNum'].some((s) => k === s)) {
            search.pageKey = k;
          } else if (['pageSize'].some((s) => k === s)) {
            search.pageSizeKey = k;
          } else {
            if (isObject(v)) {
              const obj = { ...v };
              const { description = '' } = obj;
              if (['状态', '类型'].some((s) => description.indexOf(s) > -1)) {
                obj.componentType = '选择器';
              } else if (
                ['时间', '日期'].some((s) => description.indexOf(s) > -1)
              ) {
                obj.componentType = '日期范围';
              } else {
                obj.componentType = '输入框';
              }
              if (obj.componentType === '日期范围') {
                let newDesc = description;
                k = k.replace(/Start$/i, '');
                k = k.replace(/End$/i, '');
                k = k.replace(/^lt/i, '');
                k = k.replace(/^gt/i, '');
                newDesc = newDesc.split('-')[0];
                newDesc = newDesc.replace('起始', '');
                newDesc = newDesc.replace('结束', '');
                obj.description = newDesc;
              }
              form[k] = obj;
            }
          }
        });
        search.form = form;
        apiData.search = search;
      }

      // 转换表格数据类型
      if (isObject(response)) {
        const { contents = {}, rows = {}, list = {} } = response;
        const temp = Object.assign(contents, rows, list);
        const columnsObj = get(temp, 'items.properties');
        const col = {};
        Object.entries(columnsObj).forEach(([k, v]) => {
          if (isObject(v)) {
            const obj = { ...v };
            const { description = '' } = obj;
            if (
              ['金额', '价', '付款'].some((s) => description.indexOf(s) > -1)
            ) {
              obj.componentType = '金额';
            } else if (
              ['时间', '日期'].some((s) => description.indexOf(s) > -1)
            ) {
              obj.componentType = '时间';
            } else {
              obj.componentType = '默认';
            }
            col[k] = obj;
          } else {
            col[k] = v;
          }
        });
        apiData.columnsObj = col;
      }
    }
  }
  return apiData;
}

module.exports = {
  transData,
  mockApiData: apiData,
};
