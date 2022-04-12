const moment = require('moment')

const pacientes = [
    {id: 1 ,nome: "Robin", dataNascimento : "1984-01-11"},
    {id: 2 ,nome: "Batman", dataNascimento : "1986-02-05"},
    {id: 3 ,nome:"Superman", dataNascimento : "1990-04-20"},
    {id: 4 ,nome: "Doutor estranho", dataNascimento : "2000-11-03"}
    ];


function buscarPaciente(id){
    return pacientes.find(paciente => paciente.id == id)
}

function calcularIdade(paciente){
    const diaAtual = moment()
    const dataNascimentoFormatada = moment(paciente.dataNascimento,"YYYY-MM-DD")
    return diaAtual.diff(dataNascimentoFormatada, 'years')
}

exports.handler = async (event) => {
    // TODO implement
    console.log("Executando Lambda na aws utilizando s3")
    console.log("id informado: "+event.pacienteId )
    console.log("deploy via terminal, utilizando o AWS CLI")
    
    let pacienteEncontrado
    if(event.pacienteId){
        pacienteEncontrado = buscarPaciente(event.pacienteId)
        pacienteEncontrado.idade = calcularIdade(pacienteEncontrado)
        
        return {
        statusCode: 200,
        body: JSON.stringify(pacienteEncontrado),
    };
    }
    
    const todosPacientes = pacientes.map(paciente => ({...paciente,idade: calcularIdade(paciente)}))
    
    return {
        statusCode: 200,
        body: JSON.stringify(todosPacientes),
    };
};
