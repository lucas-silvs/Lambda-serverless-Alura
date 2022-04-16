"use strict";

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

const pacientes = [
  { id: 1, nome: "Robin", dataNascimento: "1984-01-11" },
  { id: 2, nome: "Batman", dataNascimento: "1986-02-05" },
  { id: 3, nome: "Superman", dataNascimento: "1990-04-20" },
  { id: 4, nome: "Doutor estranho", dataNascimento: "2000-11-03" },
];

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

const dynamodbOfflineOptions = {
  region: "localhost",
  endpoint: "http://localhost:8000"
}

const isOffline = () => process.env.ISOFFLINE;

const dynamoDb = isOffline()
? new AWS.DynamoDB.DocumentClient(dynamodbOfflineOptions)
: new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: process.env.PACIENTES_TABLE,
};

function buscarnaListaPaciente(id) {
  return pacientes.find((paciente) => paciente.id == id);
}

module.exports.listarPacientes = async (event) => {
  try {
    const queryString = {
      limit: 5,
      ...event.queryStringParameters
    }

    const {limit, next} = queryString

    let localParams = {
      ...params,
      Limit : limit
    }
    if(next){
      localParams.ExclusiveStartKey = {
        paciente_id: next
      }
    }

    let data = dynamoDb.scan(localParams).promise();

    let nextToken = data.LastEvaluatedKey != undefined ? await data.LastEvaluatedKey.paciente_id : null;

    const result = {
      Items: data.Items,
      next_token: nextToken
    };

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    }

  } catch (err) {
    console.log(event);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

module.exports.buscarPaciente = async (event) => {
  try {
    const { pacienteId } = event.pathParameters;
    //Essa linha funciona semelhante a uma consulta por Id em SQL: select * from PACIENTES where paciemte_id = pacienteId
    const results = await dynamoDb
      .get({
        ...params,
        Key: {
          paciente_id: pacienteId,
        },
      })
      .promise();
    if (!results.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify(
          {
            error:
              "Paciente com id " + pacienteId + " não existe na base de dados",
          },
          null,
          2
        ),
      };
    }
    const paciente = results.Item;

    return {
      statusCode: 200,
      body: JSON.stringify(paciente),
    };
  } catch (err) {
    console.log(event);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

module.exports.cadastrarPaciente = async (event) => {
  try {
    const payload = JSON.parse(event.body);
    const dataCriacao = new Date().getTime();

    const { nome, data_nascimento, email, telefone } = payload;

    const paciente = {
      paciente_id: uuidv4(),
      nome,
      data_nascimento,
      email,
      telefone,
      status: true,
      criado_em: dataCriacao,
      atualizado_em: dataCriacao,
    };

    await dynamoDb
      .put({
        TableName: "PACIENTES",
        Item: paciente,
      })
      .promise();

    return {
      statusCode: 201,
    };
  } catch (err) {
    console.log(event);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

module.exports.atualizarPaciente = async (event) => {
  const { pacienteId } = event.pathParameters;

  try {
    const timestamp = new Date().getTime();
    let dados = JSON.parse(event.body);

    const { nome, data_nascimento, email, telefone } = dados;

    await dynamoDb
      .update({
        ...params,
        Key: {
          paciente_id: pacienteId,
        },
        UpdateExpression:
          "SET nome= :nome, data_nascimento = :dt, email = :email, telefone = :telefone," +
          " atualizado_em = :atualizado_em",
        ConditionExpression: "attribute_exists(paciente_id)",
        ExpressionAttributeValues: {
          ":nome": nome,
          ":dt": data_nascimento,
          ":email": email,
          ":atualizado_em": timestamp,
          ":telefone" : telefone
        },
      })
      .promise()

    return {
      statusCode: 204,
    };
  } catch (err) {
    console.log("Error", err);

    let error = err.name ? err.name : "Exception";
    let message = err.message ? err.message : "Unknown error";
    let statusCode = err.statusCode ? err.statusCode : 500;

    if(error = 'ConditionalCheckFailedException') {
      error = 'Paciente não existe na base de dados';
      message = `Recurso com o ID ${pacienteId} não existe e não pode ser atualizado`;
      statusCode = 404;
    }

    return {
      body: JSON.stringify({
        statusCode,
        message
      }),
    };

  }
  
};


module.exports.deletarPaciente = async (event) => {

  const {pacienteId} = event.pathParameters

  try{
    await dynamoDb
    .delete({
      ...params,
      Key: { paciente_id: pacienteId},
      ConditionExpression: 'attribute_exists(paciente_id)'
    })
    .promise()

    return{
      statusCode: 204
    }
  } catch(err) {
    console.log("Error", err);

    let error = err.name ? err.name : "Exception";
    let message = err.message ? err.message : "Unknown error";
    let statusCode = err.statusCode ? err.statusCode : 500; 

    if(error = 'ConditionalCheckFailedException') {
      error = 'Paciente não existe na base de dados';
      message = `Recurso com o ID ${pacienteId} não existe e não pode ser deletado`;
      statusCode = 404;
    }

    return {
      body: JSON.stringify({
        statusCode,
        message
      }),
    };

  }

}
