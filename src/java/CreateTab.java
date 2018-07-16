import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.HPos;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;

public class CreateTab extends Tab {

    private GridPane gP = new GridPane();

    private TextField privateKeyTxt = new TextField();
    private TextField timeLimitTxt = new TextField();
    private TextField maxFeeTxt = new TextField();

    private TextArea infoTxt = new TextArea();

    public CreateTab() {
        this.setText("Create");
        this.setContent(gP);

        gP.setHgap(5);
        gP.setVgap(10);
        gP.alignmentProperty().set(Pos.TOP_CENTER);
        gP.setPadding(new Insets(10));

        ColumnConstraints col1 = new ColumnConstraints();
        col1.setPercentWidth(20);
        col1.setHalignment(HPos.RIGHT);

        ColumnConstraints col2 = new ColumnConstraints();
        col2.setPercentWidth(60);
        col2.setHalignment(HPos.LEFT);

        gP.getColumnConstraints().addAll(col1, col2);

        int freeRowId = createStaticMenu();
        freeRowId = createRecordPurpose(freeRowId);


        createBottom(freeRowId);
    }

    private int createStaticMenu() {
        gP.addColumn(0,
                new Label("Wallet private key"),
                new Label("Time limit"),
                new Label("Max fee"));

        gP.addColumn(1, privateKeyTxt, timeLimitTxt, maxFeeTxt);

        return 3;
    }

    private int createRecordPurpose(int rowId) {
        gP.add(new Label("Record Purpose"), 0, rowId);

        ObservableList<String> purposeOptions =
                FXCollections.observableArrayList(
                        "Information",
                        "Signature"
                );

        gP.add(new ComboBox<>(purposeOptions), 1, 3);
        gP.add(infoTxt, 1, rowId + 1);

        return rowId + 2;
    }

    private void createBottom(int rowId) {
        Button confirmBtn = new Button("Send");
        confirmBtn.setTooltip(new Tooltip("Sends data to the selected blockchain network."));
        confirmBtn.setOnAction(event -> {
            // TODO Prepare data and send it to blockchain
        });

        HBox hBox = new HBox(confirmBtn);
        hBox.setAlignment(Pos.CENTER_RIGHT);

        gP.add(hBox, 1, rowId);
    }
}
