const express = require('express')
const mysql = require('mysql')
const app = express()
const expressPort = 3000

// PERMET A L'API DE COMMUNIQUER EN JSON
app.use(express.json())


// CONFIGURATION DE LA DB (ADRESSE, ET IDENTIFICATION ADMIN, PORTS, ect...)
const dataBase = mysql.createConnection({
  host: 'localhost',
  user: 'root',
 port: '3306',
  password: 'root',
  database: 'restapi2'
})

dataBase.connect((err) => {
if(err)
{
  console.log('ERREUR DE CONNEXION A LA DATABASE')
  } else {
    console.log('BRAVO, VOUS ÊTES CONNECTE A LA DATABASE')
  }
})

app.listen(expressPort, () => {
  console.log('MON SERVEUR TOURNE SUR LE PORT : ' , expressPort)
})


app.get('/items/:id', (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT items.id, items.name, items.prix, items.description
    FROM items
    JOIN item_category ON items.id = item_category.items_id
    WHERE item_category.category_id = ?`;

  dataBase.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur du serveur lors de la récupération des items.' });
    } else if (result.length === 0) {
      return res.status(404).json({ message: 'Aucun plat trouvé pour cette catégorie.' });
    } else {
      return res.status(200).json(result);
    }
  });
});




app.post('/create', (req, res) => {
  const { name, prix, id_category, description } = req.body;

  const sql = "INSERT INTO items (name, prix, description) VALUES (?, ?, ?)";
  const values = [name, prix, description];

  dataBase.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'ERREUR DU SERVEUR' });
    }

    const itemId = result.insertId;
    const sqlCategory = "INSERT INTO item_category (items_id, category_id) VALUES (?, ?)";
    const valuesCategory = [itemId, id_category];

    dataBase.query(sqlCategory, valuesCategory, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'ERREUR DU SERVEUR LORS DE LA LIAISON CATEGORIE' });
      } else {
        return res.status(200).json({ id: itemId, name, prix, id_category, description });
      }
    });
  });
});

      app.put('/update/:id', (req, res) => {
        const id = req.params.id;
        const { name, prix, id_category, description } = req.body;

        const sql = "UPDATE items SET name = ?, prix = ?, description = ? WHERE id = ?";
        const values = [name, prix, description, id];

        dataBase.query(sql, values, (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'ERREUR DU SERVEUR' });
          }

          const sqlCategory = "UPDATE item_category SET category_id = ? WHERE items_id = ?";
          const valuesCategory = [id_category, id];

          dataBase.query(sqlCategory, valuesCategory, (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'ERREUR DU SERVEUR LORS DE LA MISE A JOUR DE LA CATEGORIE' });
            } else {
              return res.status(200).json({ message: 'Élément mis à jour', name, prix, id_category, description });
            }
          });
        });
      });



      app.delete('/delete/:id', (req, res) => {
        const categoryId = req.params.id;

        
        const sqlDeleteCategory = "DELETE FROM item_category WHERE category_id = ?";
        dataBase.query(sqlDeleteCategory, [categoryId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Erreur du serveur lors de la suppression des catégories.' });
          }


          const sqlDeleteItems = `
            DELETE FROM items
            WHERE id IN (
              SELECT items_id
              FROM item_category
              WHERE category_id = ?
            )`;

          dataBase.query(sqlDeleteItems, [categoryId], (err) => {
            if (err) {
              return res.status(500).json({ error: 'Erreur du serveur lors de la suppression des éléments.' });
            } else {
              return res.status(200).json({ message: 'Tous les éléments associés à cette catégorie ont été supprimés.' });
            }
          });
        });
      });
