'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); 

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const todo = requestBody.todo;
  

  // if (typeof todo !== 'string' || typeof email !== 'string' || typeof experience !== 'number') {
  //   console.error('Validation Failed');
  //   callback(new Error('Couldn\'t submit candidate because of validation errors.'));
  //   return;
  // }

  submitTodo(todoInfo(todo))
    .then(res => {
      callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({
          message: `Sucessfully submitted todo`,
          todoId: res.id
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to submit todo`
        })
      })
    });
};


module.exports.list = (event, context, callback) => {
  var params = {
      TableName: process.env.TODO_TABLE,
      ProjectionExpression: "id, todo, submittedAt"
  };

  console.log("Scanning Todo table.");
  const onScan = (err, data) => {

      if (err) {
          console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
          callback(err);
      } else {
          console.log("Scan succeeded.");
          return callback(null, {
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
              },
              body: JSON.stringify({
                  todos: data.Items
              })
          });
      }

  };

  dynamoDb.scan(params, onScan);

};

module.exports.get = (event, context, callback) => {
  const params = {
    TableName: process.env.TODO_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };

  dynamoDb.get(params).promise()
    .then(result => {
      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify(result.Item),
      };
      callback(null, response);
    })
    .catch(error => {
      console.error(error);
      callback(new Error('Couldn\'t fetch todo.'));
      return;
    });
};

module.exports.delete = (event, context, callback) => {
  const params = {
    TableName: process.env.TODO_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };

  dynamoDb.delete(params).promise()
    .then(result => {
      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({
          message: `Sucessfully deleted todo`,
          todoId: result.id
        })
      };
      callback(null, response);
    })
    .catch(error => {
      console.error(error);
      callback(new Error('Couldn\'t delete todo.'));
      return;
    });
};


const submitTodo = todo => {
  console.log('Submitting todo');
  const todoInfo = {
    TableName: process.env.TODO_TABLE,
    Item: todo,
  };
  return dynamoDb.put(todoInfo).promise()
    .then(res => todo);
};

const todoInfo = (todo) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    todo: todo,
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
};