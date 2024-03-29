import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { CarDriveConsts, CarEngineConsts, CarTransmissionConsts } from 'src/app/common/constants/car-details.const';
import { CarCharacteristicsRequestDTO } from 'src/app/common/interfaces/dto/carCharacteristicsRequest.dto';
import { EditOrViewDialog } from 'src/app/common/interfaces/dialog-interfaces/dialog.interface';
import { UpdateCarDto } from 'src/app/common/interfaces/dto/car.dto';
import { ApiCarDetailsModel, DriveType, EngineType, TransmissionType } from 'src/app/common/interfaces/models/api-car-details.model';
import { ConverterService } from 'src/app/common/services/converter.service';
import { GarageService } from 'src/app/common/services/garage/garage.service';
import { SpinnerService } from 'src/app/common/services/spinner.service';
import { CreateCarDto } from 'src/app/common/interfaces/dto/creat-car.dto';

@Component({
  selector: 'app-view-car-dialog',
  templateUrl: './view-car-dialog.component.html',
  styleUrls: ['./view-car-dialog.component.scss']
})
export class ViewCarDialogComponent implements OnInit {
  viewTitle = "Параметры автомобиля";
  editTitle = "Технические характеристики автомобиля";

  carCreateMode: boolean = false;
  
  carDetails: ApiCarDetailsModel | null = {
    id: 1,
    mark: 'BMW',
    model: 'M3',
    year: 2022,
    stateNumber: '1ААА11161',
    transmission: 0,
    engineType: 'Дизель',
    drive: 'Полный',
    mileage: 234423,
    certificateId: 2
  }

  form: FormGroup;

  transmissions = CarTransmissionConsts;
  drives = CarDriveConsts;
  engines = CarEngineConsts;


  constructor(
    public dialogRef: MatDialogRef<ViewCarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditOrViewDialog,
    private carService: GarageService,
    private spinner: SpinnerService, 
    private convertService: ConverterService,
    private fb: FormBuilder) {
      this.form = this.fb.group({
        year: ['' , Validators.required],
        mark: ['', Validators.required],
        model: ['' , Validators.required],
        stateNumber: ['', Validators.compose([Validators.required, Validators.pattern(/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}/)])],
        transmission: [''],
        engineType: [''],
        drive: [''],
        mileage: ['', Validators.required],
      })
     }

  ngOnInit(): void {
    if (!this.data.certificateId && this.data.certificateId !== 0){
      this.loadCar();
      this.carCreateMode = false;
    } else {
      this.carCreateMode = true;
    }
  }

  loadCar(): void{
    if (this.data.id){
      this.spinner.show();
      this.carService.getCarById(this.data.id)
      .pipe(
        finalize(()=> {
          this.spinner.hide();
        })
      )
      .subscribe((res) => {
        this.carDetails = res;
        this.convertValues();
        this.setValuesInForm();
      });
    }
  }

  convertValues(): void{
    if (this.carDetails && this.carDetails.drive && this.carDetails.engineType){
      let drive = this.convertService.convertDriveToEnum(this.carDetails.drive.toString());
      let engine = this.convertService.convertEngineToEnum(this.carDetails.engineType.toString());

      this.carDetails.drive = drive;
      this.carDetails.engineType = engine;
    }
  }

  setValuesInForm(): void{
    if (this.carDetails){
      this.form.get('year')?.setValue(this.carDetails.year);
      this.form.get('mark')?.setValue(this.carDetails.mark);
      this.form.get('model')?.setValue(this.carDetails.model);
      this.form.get('transmission')?.setValue(this.carDetails.transmission);
      this.form.get('engineType')?.setValue(this.carDetails.engineType);
      this.form.get('mileage')?.setValue(this.carDetails.mileage);
      this.form.get('drive')?.setValue(this.carDetails.drive);
      this.form.get('stateNumber')?.setValue(this.carDetails.stateNumber);
    }
  }

  save(): void{
    if (!this.carCreateMode) {
      this.update();
    } else {
      this.create();
    }
  }

  update(): void{
    if (this.form.valid && this.data.id){
      let dto: UpdateCarDto = {
        mark: this.form.get('mark')?.pristine ? null : this.form.get('mark')?.value,
        year: this.form.get('year')?.pristine ? null : this.form.get('year')?.value,
        model: this.form.get('model')?.pristine ? null : this.form.get('model')?.value,
        mileage: this.form.get('mileage')?.pristine ? null : this.form.get('mileage')?.value,
        transmission: this.form.get('transmission')?.pristine ? null : this.form.get('transmission')?.value,
        drive: this.form.get('drive')?.pristine 
          ? null 
          : this.convertService.convertDriveToString(this.form.get('drive')?.value),
        engineType: this.form.get('engineType')?.pristine 
          ? null 
          : this.convertService.convertEngineToString(this.form.get('engineType')?.value),
        stateNumber: this.form.get('stateNumber')?.pristine ? null : this.form.get('stateNumber')?.value,
      }

      this.carService.updateCar(this.data.id, dto)
      .subscribe((res) => {
        this.close(true);
      })
    }
  }

  create(): void{
    if (this.form.valid && this.data.certificateId){
      let dto: CreateCarDto = {
        carCertificateId: this.data.certificateId,
        mark: this.form.get('mark')?.value,
        year: this.form.get('year')?.value,
        model: this.form.get('model')?.value,
        mileage: this.form.get('mileage')?.value,
        transmission: this.form.get('transmission')?.value,
        drive: this.convertService.convertDriveToString(this.form.get('drive')?.value),
        engineType: this.convertService.convertEngineToString(this.form.get('engineType')?.value),
        stateNumber: this.form.get('stateNumber')?.pristine ? null : this.form.get('stateNumber')?.value,
      }

      this.carService.createCar(dto)
      .subscribe((res) => {
        this.close(true);
      })
    }
  }


  close(success: boolean): void{
    this.dialogRef.close(success);
  }

  sendCharacteristics():void{
    let dto: CarCharacteristicsRequestDTO={carId: this.carDetails!.id, email: null }
    this.carService.sendCarCharacteristicsToEmail(dto).subscribe()
  }
}
