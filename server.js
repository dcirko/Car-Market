const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());


app.use('/images', express.static(path.join(__dirname, 'public/images')));

const multer = require('multer');   

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '47LFKBAp',
    database: 'carzone'
});

db.connect(err => {
    if (err) {
        console.error('❌ Greška pri spajanju na bazu:', err);
    } else {
        console.log('✅ Uspješno spojen na MySQL bazu');
    }
});



/*getSpecs*/
app.get('/api/automobili/:id/specifikacije', (req, res) => {
    const automobilId = req.params.id;

    const query = `
        SELECT a.*, s.snaga, s.motor, s.boja, s.gorivo, s.mjenjac, s.pogon 
        FROM automobili a
        JOIN specifikacije s ON a.id = s.automobil_id
        WHERE a.id = ?;
    `;

    db.query(query, [automobilId], (err, result) => {
        if (err) {
            console.error('❌ Greška pri dohvaćanju podataka:', err);
            res.status(500).send('Greška pri dohvaćanju podataka');
        } else if (result.length === 0) {
            res.status(404).send('Podaci nisu pronađeni');
        } else {
            res.json(result[0]);  // Pošalji samo prvi rezultat (ako postoji)
        }
    });
});

app.get('/api/automobili', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    let query = `
        SELECT a.*, s.snaga, s.motor, s.boja, s.gorivo, s.mjenjac, s.pogon 
        FROM automobili a
        JOIN specifikacije s ON a.id = s.automobil_id
        ORDER BY a.cijena DESC
    `;

    if (limit) {
        query += ' LIMIT ?';
    }

    db.query(query, limit ? [limit] : [], (err, result) => {
        if (err) {
            console.error('❌ Greška pri dohvaćanju podataka:', err);
            res.status(500).send('Greška pri dohvaćanju podataka');
        } else {
            res.json(result);
        }
    });
});




/*addCar*/
app.post('/api/automobili', upload.single('slika'), (req, res) => {
    const { marka, model, godina, kilometraza, cijena, motor, snaga, boja, gorivo, mjenjac, pogon } = req.body;
    const slika = req.file ? `images/${req.file.filename}` : null;

    const sql = 'INSERT INTO automobili (marka, model, godina, cijena, slika, kilometri) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [marka, model, godina, cijena, slika, kilometraza], (err, result) => {
        if (err) {
            console.error('❌ Greška pri dodavanju automobila:', err);
            res.status(500).send('Greška pri spremanju automobila');
        } 

        const sqlSpecs = 'INSERT INTO specifikacije (automobil_id, motor, snaga, boja, gorivo, mjenjac, pogon) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(sqlSpecs, [result.insertId, motor, snaga, boja, gorivo, mjenjac, pogon], (err, result) => {
            if (err) {
                console.error('❌ Greška pri dodavanju specifikacija:', err);
                res.status(500).send('Greška pri spremanju specifikacija');
            } else {
                res.json({ message: '✅ Automobil dodan!' });
            }
        });
    });
});


/*editCar*/
app.put('/api/automobili/:id', upload.single('slika'), (req, res) => {
    const automobilId = req.params.id;
    const { marka, model, godina, kilometraza, cijena, motor, snaga, boja, gorivo, mjenjac, pogon } = req.body;
    
    let sqlAutomobil, paramsAutomobil;

    if (req.file) {
        const slika = `images/${req.file.filename}`;
        sqlAutomobil = `UPDATE automobili 
                        SET marka = ?, model = ?, godina = ?, cijena = ?, slika = ?, kilometri = ? 
                        WHERE id = ?`;
        paramsAutomobil = [marka, model, godina, cijena, slika, kilometraza, automobilId];
    } else {
        sqlAutomobil = `UPDATE automobili 
                        SET marka = ?, model = ?, godina = ?, cijena = ?, kilometri = ? 
                        WHERE id = ?`;
        paramsAutomobil = [marka, model, godina, cijena, kilometraza, automobilId];
    }

    db.query(sqlAutomobil, paramsAutomobil, (err, result) => {
        if (err) {
            console.error('❌ Greška pri ažuriranju automobila:', err);
            return res.status(500).send('Greška pri ažuriranju automobila');
        }

        const sqlSpecifikacije = `UPDATE specifikacije 
                                  SET motor = ?, snaga = ?, boja = ?, gorivo = ?, mjenjac = ?, pogon = ? 
                                  WHERE automobil_id = ?`;
        const paramsSpecifikacije = [motor, snaga, boja, gorivo, mjenjac, pogon, automobilId];

        db.query(sqlSpecifikacije, paramsSpecifikacije, (err, result) => {
            if (err) {
                console.error('❌ Greška pri ažuriranju specifikacija:', err);
                return res.status(500).send('Greška pri ažuriranju specifikacija');
            }
            res.json({ message: '✅ Automobil i specifikacije ažurirani!' });
        });
    });
});


/*deleteCar*/
app.delete('/api/automobili/:id', (req, res) => {
    const automobilId = req.params.id;

    const sqlDeleteKupnje = 'DELETE FROM kupnje WHERE automobil_id = ?';
    db.query(sqlDeleteKupnje, [automobilId], (err, result) => {
        if (err) {
            console.error('❌ Greška pri brisanju kupnji:', err);
            return res.status(500).send('Greška pri brisanju kupnji');
        }

        const sqlDeleteSpecifikacije = 'DELETE FROM specifikacije WHERE automobil_id = ?';
        db.query(sqlDeleteSpecifikacije, [automobilId], (err, result) => {
            if (err) {
                console.error('❌ Greška pri brisanju specifikacija:', err);
                return res.status(500).send('Greška pri brisanju specifikacija');
            }

            const sqlDeleteAutomobil = 'DELETE FROM automobili WHERE id = ?';
            db.query(sqlDeleteAutomobil, [automobilId], (err, result) => {
                if (err) {
                    console.error('❌ Greška pri brisanju automobila:', err);
                    return res.status(500).send('Greška pri brisanju automobila');
                }
                
                res.json({ message: '✅ Automobil i svi povezani podaci obrisani!' });
            });
        });
    });
});






/*buyCar*/
app.post('/api/kupi', (req, res) => {
    const {korisnik_id, automobil_id, cijena, nacinPlacanja} = req.body;
    const sql = `INSERT INTO kupnje (korisnik_id, automobil_id, cijena, nacin_placanja) VALUES (?, ?, ?, ?)`;

    db.query(sql, [korisnik_id, automobil_id, cijena, nacinPlacanja], (err, result) => {
        if (err) {
            console.error('❌ Greška pri kupnji:', err);
            res.status(500).send('Greška pri kupnji');
        } else {
            res.json({ message: '✅ Kupnja uspješna!' });
        }
    });


});


app.get('/api/automobili/:carId/status-kupnje/:userId', (req, res) => {
    const sql = 'SELECT COUNT(*) AS count FROM kupnje WHERE automobil_id = ? AND korisnik_id = ?';

    db.query(sql, [req.params.carId, req.params.userId], (err, result) => {
        if (err) {
            console.error('❌ Greška pri provjeri kupnje auta:', err);
            return res.status(500).json({ error: 'Greška pri provjeri kupnje auta' });
        }

        const isBought = result[0].count > 0;
        res.json({ kupljen: isBought });
    });
});






/*getKupnje*/
app.get('/api/kupnje/:korisnik_id', (req, res) => {
    const korisnik_id = req.params.korisnik_id;

    //const sql = `SELECT * FROM kupnje WHERE korisnik_id = ?`;
    const sql = `SELECT k.*, a.marka, a.model, a.godina, a.cijena, a.slika, a. kilometri 
                FROM kupnje k JOIN automobili a ON k.automobil_id = a.id WHERE k.korisnik_id = ?`;


    db.query(sql, [korisnik_id], (err, result) => {
        if (err) {
            console.error('❌ Greška pri dohvaćanju kupnji:', err);
            res.status(500).send('Greška pri dohvaćanju kupnji');
        } else {
            res.json(result);
        }
    });
});

/*getUsers*/
app.get('/api/korisnici/:korisnik_id', (req, res) => {
    const korisnik_id = req.params.korisnik_id;

    const sql = `SELECT * FROM users where id = ?`;

    db.query(sql, [korisnik_id], (err, result) => {
        if (err) {
            console.error('❌ Greška pri dohvaćanju korisnika:', err);
            res.status(500).send('Greška pri dohvaćanju korisnika');
        } else {
            res.json(result);
        }
    });
});


app.listen(3000, () => {
    console.log('🚀 Server pokrenut na portu 3000');
});
