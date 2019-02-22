import AWS from 'aws-sdk';

class S3Service {
  constructor() {
    this.bucketName = process.env.AWS_BUCKET_NAME;
    this.s3URL = process.env.S3_PUBLIC_URL;
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY_ID,
      region: process.env.AWS_REGION,
    });
  }

  getBucketName() {
    return this.bucketName;
  }

  getPresignedURL({ Key, mimeType: ContentType, uuid }, action = 'putObject') {
    const params = {
      Key,
      ContentType,
      ContentDisposition: 'attachment',
      ACL: 'public-read',
      Bucket: this.bucketName,
      Expires: 1800,
      Metadata: {
        uuid,
      },
    };
    const futureFileURL = `${this.s3URL}${Key}`;
    return new Promise((resolve, reject) => {
      this.s3.getSignedUrl(action, params, (err, url) => {
        if (err) reject(err);
        resolve({ uuid, url, futureFileURL });
      });
    });
  }

  deleteObject(Key) {
    cano.log.debug('deleteObject -> Key', Key);
    const params = {
      Key,
      Bucket: this.bucketName,
    };
    return new Promise((resolve, reject) => {
      this.s3.deleteObject(params, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }
}

export default S3Service;
