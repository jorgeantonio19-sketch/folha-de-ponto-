// CLASSE DE UTILITÁRIOS
class Utils {
    static toMin(v) {
        if (!v) return 0;
        const [h, m] = v.split(':').map(Number);
        return h * 60 + m;
    }

    static minToStr(min) {
        const neg = min < 0, a = Math.abs(min);
        return (neg ? '-' : '') + Math.floor(a / 60) + 'h ' + String(a % 60).padStart(2, '0') + 'm';
    }

    static showToast(msg) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2200);
    }
}

// MODELO DE DADOS DA FOLHA DE PONTO
class RegistroPonto {
    constructor(dia, status, horas) {
        this.dia = dia;
        this.status = status;
        this.horas = horas; // Array [E1, S1, E2, S2]
    }
}

// MODELO DE DADOS DO CURRÍCULO
class CurriculoModel {
    constructor(nome, dataNascimento, email, telefone, cargo, empresa, tarefas, escolaridade, instituicao, fotoBase64) {
        this.nome = nome || '';
        this.dataNascimento = dataNascimento || '';
        this.email = email || '';
        this.telefone = telefone || '';
        this.cargo = cargo || '';
        this.empresa = empresa || '';
        this.tarefas = tarefas || '';
        this.escolaridade = escolaridade || '';
        this.instituicao = instituicao || '';
        this.fotoBase64 = fotoBase64 || '';
    }
}
