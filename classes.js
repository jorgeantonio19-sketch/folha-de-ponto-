// MODELO DE DADOS DE UM DIA DE PONTO
class RegistroDiaModel {
    constructor(dataStr, status = 'Trabalhado', ent1 = '', sai1 = '', ent2 = '', sai2 = '') {
        this.dataStr = dataStr;
        this.status = status;
        this.ent1 = ent1;
        this.sai1 = sai1;
        this.ent2 = ent2;
        this.sai2 = sai2;
    }
}

// MODELO DE DADOS DA FOLHA MENSAL
class FolhaPontoModel {
    constructor(colaborador, mesAno, registros = []) {
        this.colaborador = colaborador;
        this.mesAno = mesAno;
        this.registros = registros;
    }
}

// MODELO DE DADOS DO CURRÍCULO (EUROPASS)
class CurriculoModel {
    constructor(nome, dataNascimento, email, telefone, endereco, experiencias, escolaridade, instituicao, fotoBase64) {
        this.nome = nome || '';
        this.dataNascimento = dataNascimento || '';
        this.email = email || '';
        this.telefone = telefone || '';
        this.endereco = endereco || '';
        this.experiencias = experiencias || []; // Array com objetos { cargo, empresa, tarefas }
        this.escolaridade = escolaridade || '';
        this.instituicao = instituicao || '';
        this.fotoBase64 = fotoBase64 || '';
    }
}

// UTILITÁRIOS GERAIS
const Utils = {
    showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = 'toast show';
        setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
    },

    minutosParaTexto(minutos) {
        const sinal = minutos < 0 ? '-' : '';
        const abs = Math.abs(minutos);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        return `${sinal}${h}h ${m.toString().padStart(2, '0')}m`;
    },

    calcularDiferencaMinutos(horaIni, horaFim) {
        if (!horaIni || !horaFim) return 0;
        const [h1, m1] = horaIni.split(':').map(Number);
        const [h2, m2] = horaFim.split(':').map(Number);
        const t1 = h1 * 60 + m1;
        const t2 = h2 * 60 + m2;
        return t2 > t1 ? t2 - t1 : 0;
    }
};
