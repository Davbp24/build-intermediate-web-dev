import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { saveAnnotations } from './apiBranch/AnnotationsAPI';

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Required for Chrome's Private Network Access policy —
// allows content scripts on public pages to fetch localhost
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.send('Inline backend is running');
});

// Universal pipeline — receives any feature's data and persists it to Supabase
app.post('/api/annotations', saveAnnotations);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
