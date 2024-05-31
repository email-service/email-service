export class ESP {
    transporter;
    constructor(service) {
        this.transporter = service;
        console.log('******** ES ********  New Instance of ', this.transporter.esp);
    }
    async sendMail(options) {
        return ({ success: false, status: 500, error: { name: 'NO_METHOD', message: 'This function do never to be call, contact the developper' } });
    }
    async webHookManagement(req) {
        return ({ success: false, status: 500, error: { name: 'NO_METHOD', message: 'This function do never to be call, contact the developper' } });
    }
}
